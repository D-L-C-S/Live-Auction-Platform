import { useState } from "react";

const API_BASE = "";

const ENDPOINTS = {
  createListing: `${API_BASE}/api/auctions`,
  getAuction: (id) => `${API_BASE}/api/auctions/${id}`,
};

const STATUS_STYLES = {
  active:  { bg: "#ecfdf5", color: "#166534" },
  closed:  { bg: "#f3f4f6", color: "#4b5563" },
  settled: { bg: "#eff6ff", color: "#1e40af" },
};

const mockListings = [
  { id: "a1", title: "Vintage Leica M3", startingPrice: 12000, reservePrice: 18000, currentBid: 21500, endsIn: "4h 22m", status: "active" },
  { id: "a2", title: "Gibson SG Standard", startingPrice: 35000, reservePrice: 40000, currentBid: 38000, endsIn: "1d 11h", status: "active" },
  { id: "a3", title: "Canon AE-1 Kit", startingPrice: 4500, reservePrice: 6000, currentBid: 7200, endsIn: null, status: "settled" },
  { id: "a4", title: "Rolex Datejust 36", startingPrice: 220000, reservePrice: 280000, currentBid: 260000, endsIn: null, status: "closed" },
];

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// ─── Create Listing Form ──────────────────────────────────────────────────────

function CreateListingForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "", description: "", images: "",
    startingPrice: "", reservePrice: "",
    endDate: "", endTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.startingPrice || !form.endDate || !form.endTime) {
      setError("Title, starting price, and auction end date/time are required.");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      startingPrice: Number(form.startingPrice),
      reservePrice: form.reservePrice ? Number(form.reservePrice) : null,
      auctionEndTime: `${form.endDate}T${form.endTime}:00.000Z`,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(ENDPOINTS.createListing, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onSuccess(data.auction);
    } catch (err) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>New listing</span>
        <code style={styles.endpointTag}>POST /api/auctions</code>
      </div>

      {error && <div style={styles.errorBar}>{error}</div>}

      <div style={styles.fieldFull}>
        <label style={styles.label}>Item title *</label>
        <input style={styles.input} value={form.title} onChange={set("title")} placeholder="e.g. Vintage Leica M3 Camera" />
      </div>

      <div style={styles.fieldFull}>
        <label style={styles.label}>Description</label>
        <textarea style={{ ...styles.input, minHeight: 72, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Condition, details, provenance..." />
      </div>

      <div style={styles.fieldFull}>
        <label style={styles.label}>Image URLs (comma-separated)</label>
        <input style={styles.input} value={form.images} onChange={set("images")} placeholder="https://cdn.example.com/img1.jpg, ..." />
      </div>

      <div style={styles.row}>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>Starting price (₹) *</label>
          <input style={styles.input} type="number" min="0" value={form.startingPrice} onChange={set("startingPrice")} placeholder="5000" />
        </div>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>Reserve price (₹)</label>
          <input style={styles.input} type="number" min="0" value={form.reservePrice} onChange={set("reservePrice")} placeholder="8000" />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>End date *</label>
          <input style={styles.input} type="date" value={form.endDate} onChange={set("endDate")} />
        </div>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>End time *</label>
          <input style={styles.input} type="time" value={form.endTime} onChange={set("endTime")} />
        </div>
      </div>

      <div style={styles.payloadHint}>
        Sends → <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          {"{ title, description, images[], startingPrice, reservePrice, auctionEndTime }"}
        </code>
      </div>

      <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </div>
  );
}

// ─── Listings Table ───────────────────────────────────────────────────────────

function ListingsTable({ listings }) {
  return (
    <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Item", "Starting", "Reserve", "Current bid", "Ends in", "Status"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td style={{ ...styles.td, fontWeight: 500 }}>{l.title}</td>
              <td style={styles.td}>{fmt(l.startingPrice)}</td>
              <td style={styles.td}>{fmt(l.reservePrice)}</td>
              <td style={{ ...styles.td, color: l.status === "active" ? "#166534" : "inherit", fontWeight: l.status === "active" ? 500 : 400 }}>
                {fmt(l.currentBid)}
              </td>
              <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>
                {l.endsIn ?? "—"}
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...STATUS_STYLES[l.status] }}>
                  {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [listings, setListings] = useState(mockListings);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSuccess = (newAuction) => {
    setListings((prev) => [
      {
        id: newAuction._id,
        title: newAuction.title,
        startingPrice: newAuction.startingPrice,
        reservePrice: newAuction.reservePrice,
        currentBid: newAuction.startingPrice,
        endsIn: "calculating…",
        status: "active",
      },
      ...prev,
    ]);
    setSuccessMsg(`"${newAuction.title}" is now live.`);
    setTab("dashboard");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const activeCount  = listings.filter((l) => l.status === "active").length;
  const closedCount  = listings.filter((l) => l.status !== "active").length;
  const totalSettled = listings.filter((l) => l.status === "settled").reduce((s, l) => s + l.currentBid, 0);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Seller dashboard</span>
        <button style={styles.btnOutline} onClick={() => setTab(tab === "create" ? "dashboard" : "create")}>
          {tab === "create" ? "← Back" : "+ New listing"}
        </button>
      </div>

      {successMsg && <div style={styles.successBar}>{successMsg}</div>}

      {tab === "dashboard" && (
        <>
          <div style={styles.statGrid}>
            {[
              { label: "Active listings", val: activeCount },
              { label: "Closed auctions", val: closedCount },
              { label: "Total settled", val: fmt(totalSettled) },
            ].map((s) => (
              <div key={s.label} style={styles.stat}>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.statVal}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ ...styles.sectionHeader, marginBottom: 12 }}>
            <span style={styles.sectionTitle}>My listings</span>
          </div>
          <ListingsTable listings={listings} />
        </>
      )}

      {tab === "create" && <CreateListingForm onSuccess={handleSuccess} />}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: { fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "1.5rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" },
  headerTitle: { fontSize: 18, fontWeight: 500 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" },
  stat: { background: "#f9fafb", borderRadius: 8, padding: "1rem" },
  statLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  statVal: { fontSize: 22, fontWeight: 500 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
  sectionTitle: { fontSize: 14, fontWeight: 500 },
  card: { background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", fontSize: 11, fontWeight: 500, color: "#9ca3af", padding: "6px 12px", borderBottom: "0.5px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.04em" },
  td: { padding: "10px 12px", borderBottom: "0.5px solid #f3f4f6", verticalAlign: "middle", fontSize: 13 },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500 },
  endpointTag: { fontFamily: "monospace", fontSize: 11, background: "#f3f4f6", border: "0.5px solid #e5e7eb", padding: "3px 7px", borderRadius: 4, color: "#6b7280" },
  label: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 4, display: "block" },
  input: { fontSize: 13, padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: 8, background: "#fff", color: "#111827", width: "100%", boxSizing: "border-box" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fieldFull: { marginBottom: 12 },
  fieldHalf: {},
  payloadHint: { background: "#f9fafb", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#6b7280", marginBottom: 12 },
  btnPrimary: { background: "#111827", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" },
  btnOutline: { fontSize: 12, fontWeight: 500, padding: "7px 14px", border: "0.5px solid #d1d5db", borderRadius: 8, background: "none", color: "#111827", cursor: "pointer" },
  successBar: { background: "#ecfdf5", border: "0.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", marginBottom: "1rem" },
  errorBar: { background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: "1rem" },
};
