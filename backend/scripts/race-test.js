/*
 * Concurrency test for the bid-placement path.
 *
 * Fires N bids CONCURRENTLY at a fresh auction and checks that the auction's
 * recorded highest bid never lags behind the highest bid that actually got
 * persisted (the lost-update symptom), that no Bid row survives a lost race,
 * and that losing bids come back as a clean 409.
 *
 * Requires the backend running on BASE_URL (default http://localhost:5000).
 *   node scripts/race-test.js
 */

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ROUNDS = Number(process.env.ROUNDS || 5);
const BIDDERS = 8;
const STARTING_PRICE = 100;
const AMOUNTS = [150, 160, 155, 170, 145, 180, 165, 175, 152, 168, 195, 185];

async function req(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}
const post = (path, body, token) => req('POST', path, body, token);
const get = (path, token) => req('GET', path, null, token);

async function register(role) {
  const email = `race_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
  const { status, data } = await post('/api/auth/register', {
    name: `Race ${role}`, email, password: 'password123', role,
  });
  if (status !== 201) throw new Error(`register(${role}) → ${status} ${JSON.stringify(data)}`);
  return { token: data.token, id: data.user._id };
}

function idOf(x) {
  if (!x) return null;
  return String(x._id || x);
}

async function runRound(n) {
  const seller = await register('seller');
  const bidders = [];
  for (let i = 0; i < BIDDERS; i += 1) bidders.push(await register('buyer'));

  const create = await post('/api/auctions', {
    title: `Race Test ${n}`,
    description: 'concurrency test auction',
    startingPrice: STARTING_PRICE,
    auctionEndTime: new Date(Date.now() + 3600_000).toISOString(),
  }, seller.token);
  if (create.status !== 201) throw new Error(`create auction → ${create.status} ${JSON.stringify(create.data)}`);
  const auctionId = create.data.auction._id;

  // ---- fire every bid at the same time ----
  const results = await Promise.all(AMOUNTS.map((amount, i) => {
    const bidder = bidders[i % bidders.length];
    return post(`/api/bids/${auctionId}`, { amount }, bidder.token)
      .then((r) => ({ amount, bidderId: bidder.id, status: r.status, data: r.data }));
  }));

  const accepted = results.filter((r) => r.status === 201);
  const rejected = results.filter((r) => r.status !== 201);

  const persisted = (await get(`/api/bids/${auctionId}`)).data || [];   // sorted amount desc
  const auction = (await get(`/api/auctions/${auctionId}`)).data.auction;

  const recordedHigh = auction.currentHighestBid;
  const recordedLeader = idOf(auction.currentHighestBidder);
  const topBid = persisted[0] || null;
  const maxAccepted = accepted.length ? Math.max(...accepted.map((r) => r.amount)) : null;

  const casRejections = rejected.filter((r) => r.status === 409);

  const checks = [
    ['persisted Bid count == accepted (201) count',
      persisted.length === accepted.length,
      `${persisted.length} persisted vs ${accepted.length} accepted`],
    ['recorded high == highest persisted bid amount',
      recordedHigh === (topBid ? topBid.amount : null),
      `high=${recordedHigh} topPersisted=${topBid ? topBid.amount : null}`],
    ['recorded high == max accepted bid amount',
      recordedHigh === maxAccepted,
      `high=${recordedHigh} maxAccepted=${maxAccepted}`],
    ['recorded leader == top persisted bidder',
      recordedLeader === idOf(topBid && topBid.bidder),
      `${recordedLeader} vs ${idOf(topBid && topBid.bidder)}`],
    ['every accepted amount > startingPrice',
      accepted.every((r) => r.amount > STARTING_PRICE), ''],
    ['every rejected response is a clean 400 or 409 (never 5xx / silent)',
      rejected.every((r) => (r.status === 400 || r.status === 409) && r.data && r.data.message),
      `statuses: ${rejected.map((r) => r.status).join(',') || 'none'}`],
    ['at least one loser hit the atomic CAS (409 PRICE_CHANGED) path',
      accepted.length <= 1 || casRejections.some((r) => r.data && r.data.code === 'PRICE_CHANGED'),
      `${casRejections.length} of ${rejected.length} rejections were 409`],
  ];

  const pass = checks.every((c) => c[1]);
  const rejCodes = [...new Set(rejected.map((r) => (r.data && r.data.code) || r.status))].join(',') || 'none';

  console.log(`\nRound ${n}: ${accepted.length}/${AMOUNTS.length} accepted, ${rejected.length} rejected [${rejCodes}]`);
  console.log(`  accepted amounts : ${accepted.map((r) => r.amount).sort((a, b) => a - b).join(', ') || '(none)'}`);
  console.log(`  recorded high    : ₹${recordedHigh}`);
  console.log(`  highest Bid row  : ₹${topBid ? topBid.amount : null}`);
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  }
  return pass;
}

// Concurrent manual bids racing against active proxy bids — exercises the CAS
// inside runProxyBidding's loop as well as the manual path.
async function runProxyRound(n) {
  const seller = await register('seller');
  const bidders = [];
  for (let i = 0; i < 5; i += 1) bidders.push(await register('buyer'));

  const create = await post('/api/auctions', {
    title: `Proxy Race ${n}`,
    description: 'proxy concurrency test',
    startingPrice: STARTING_PRICE,
    auctionEndTime: new Date(Date.now() + 3600_000).toISOString(),
  }, seller.token);
  const auctionId = create.data.auction._id;

  // two standing proxy bids
  await post(`/api/bids/${auctionId}/proxy`, { maxBid: 300 }, bidders[0].token);
  await post(`/api/bids/${auctionId}/proxy`, { maxBid: 500 }, bidders[1].token);

  // three manual bidders pile in at once, each also triggering a proxy loop
  await Promise.all([
    post(`/api/bids/${auctionId}`, { amount: 220 }, bidders[2].token),
    post(`/api/bids/${auctionId}`, { amount: 260 }, bidders[3].token),
    post(`/api/bids/${auctionId}`, { amount: 240 }, bidders[4].token),
  ]);

  const persisted = (await get(`/api/bids/${auctionId}`)).data || [];
  const auction = (await get(`/api/auctions/${auctionId}`)).data.auction;

  const noBidAboveHigh = persisted.every((b) => b.amount <= auction.currentHighestBid);
  const leaderMatches = idOf(auction.currentHighestBidder) === idOf(persisted[0] && persisted[0].bidder);
  const leaderIsProxyMax = idOf(auction.currentHighestBidder) === bidders[1].id; // maxBid 500 must end up winning

  const pass = noBidAboveHigh && leaderMatches && leaderIsProxyMax;
  console.log(`\nProxy round ${n}: ${persisted.length} bids, recorded high ₹${auction.currentHighestBid}`);
  console.log(`  ${noBidAboveHigh ? 'PASS' : 'FAIL'}  no persisted bid exceeds recorded high`);
  console.log(`  ${leaderMatches ? 'PASS' : 'FAIL'}  recorded leader == top persisted bidder`);
  console.log(`  ${leaderIsProxyMax ? 'PASS' : 'FAIL'}  highest-max proxy (₹500) is the final leader`);
  return pass;
}

(async () => {
  console.log(`Race test → ${BASE}   (${ROUNDS} rounds × ${AMOUNTS.length} concurrent bids, starting price ₹${STARTING_PRICE})`);
  let allPass = true;
  for (let n = 1; n <= ROUNDS; n += 1) {
    try {
      const ok = await runRound(n);
      allPass = ok && allPass;
    } catch (err) {
      console.log(`\nRound ${n}: ERROR — ${err.message}`);
      allPass = false;
    }
  }
  for (let n = 1; n <= ROUNDS; n += 1) {
    try {
      const ok = await runProxyRound(n);
      allPass = ok && allPass;
    } catch (err) {
      console.log(`\nProxy round ${n}: ERROR — ${err.message}`);
      allPass = false;
    }
  }
  console.log(`\n${allPass ? 'ALL ROUNDS PASSED' : 'SOME ROUNDS FAILED'}`);
  process.exit(allPass ? 0 : 1);
})();
