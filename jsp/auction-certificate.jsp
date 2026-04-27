<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.text.SimpleDateFormat, java.util.Date" %>
<%--
  Auction Result Certificate
  Endpoint context: triggered after POST /api/escrow/confirm-delivery
  Expected request attributes (set by servlet/controller):
    - auctionId       (String)
    - itemTitle       (String)
    - itemDescription (String)
    - winnerName      (String)
    - winnerEmail     (String)
    - sellerName      (String)
    - finalPrice      (double)
    - auctionEndTime  (String, ISO-8601)
    - certificateId   (String, UUID)
--%>
<%
    // --- Pull attributes from request (set by your Express → JSP bridge / servlet) ---
    String auctionId       = (String)  request.getAttribute("auctionId");
    String itemTitle       = (String)  request.getAttribute("itemTitle");
    String itemDescription = (String)  request.getAttribute("itemDescription");
    String winnerName      = (String)  request.getAttribute("winnerName");
    String winnerEmail     = (String)  request.getAttribute("winnerEmail");
    String sellerName      = (String)  request.getAttribute("sellerName");
    Object priceObj        =           request.getAttribute("finalPrice");
    String auctionEndTime  = (String)  request.getAttribute("auctionEndTime");
    String certificateId   = (String)  request.getAttribute("certificateId");

    // Hardcode defaults for local dev / testing
    if (auctionId      == null) auctionId      = "a1b2c3d4";
    if (itemTitle      == null) itemTitle      = "Vintage Leica M3 Camera";
    if (itemDescription== null) itemDescription= "1954 Leica M3 in excellent working condition. Original leather, all curtains intact.";
    if (winnerName     == null) winnerName     = "Rohan Mehta";
    if (winnerEmail    == null) winnerEmail    = "rohan@example.com";
    if (sellerName     == null) sellerName     = "Amogh Desai";
    if (auctionEndTime == null) auctionEndTime = "2025-04-26T18:30:00Z";
    if (certificateId  == null) certificateId  = "CERT-8F2A-4D1C";

    double finalPrice = 0.0;
    if (priceObj instanceof Double) finalPrice = (Double) priceObj;
    else if (priceObj instanceof String) {
        try { finalPrice = Double.parseDouble((String) priceObj); } catch(NumberFormatException ignored) {}
    }
    if (finalPrice == 0.0) finalPrice = 21500.0;

    java.text.NumberFormat inr = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("en", "IN"));
    String finalPriceFmt = inr.format(finalPrice);

    String issuedOn = new SimpleDateFormat("dd MMMM yyyy, HH:mm z").format(new Date());
%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auction Result Certificate — <%= itemTitle %></title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'EB Garamond', Georgia, serif;
      background: #f5f0e8;
      color: #1a1a1a;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 3rem 1rem;
    }

    .certificate {
      background: #fffef9;
      border: 1px solid #ccc5a8;
      max-width: 720px;
      width: 100%;
      padding: 3rem 3.5rem;
      position: relative;
    }

    .certificate::before,
    .certificate::after {
      content: '';
      position: absolute;
      inset: 12px;
      border: 0.5px solid #d4c99a;
      pointer-events: none;
    }
    .certificate::after {
      inset: 16px;
      border-style: dashed;
      border-color: #e0d9c2;
    }

    .seal-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .seal {
      width: 52px;
      height: 52px;
      border: 2px solid #8b7640;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: #8b7640;
      letter-spacing: 0.1em;
      text-align: center;
      line-height: 1.2;
      flex-shrink: 0;
      font-family: 'DM Mono', monospace;
    }

    .platform-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #5c4e2a;
    }

    .platform-sub {
      font-size: 12px;
      color: #8b7640;
      font-style: italic;
      margin-top: 2px;
    }

    .cert-title {
      font-size: 28px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.25rem;
      letter-spacing: -0.01em;
    }

    .cert-subtitle {
      font-size: 13px;
      text-align: center;
      color: #7a6a45;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2.5rem;
      font-family: 'DM Mono', monospace;
    }

    .divider {
      border: none;
      border-top: 0.5px solid #d4c99a;
      margin: 1.5rem 0;
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem 2rem;
      margin-bottom: 1.5rem;
    }

    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-group.wide { grid-column: 1 / -1; }

    .field-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8b7640;
      font-family: 'DM Mono', monospace;
    }

    .field-value {
      font-size: 17px;
      color: #1a1a1a;
      line-height: 1.4;
    }

    .field-value.price {
      font-size: 26px;
      font-weight: 600;
      color: #3a2e10;
    }

    .field-value.mono {
      font-family: 'DM Mono', monospace;
      font-size: 14px;
      color: #5c4e2a;
    }

    .confirmation-banner {
      background: #f0ead8;
      border: 0.5px solid #c8b97a;
      border-radius: 4px;
      padding: 1rem 1.25rem;
      font-size: 14px;
      color: #4a3d18;
      font-style: italic;
      text-align: center;
      margin: 1.5rem 0;
      line-height: 1.6;
    }

    .sig-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 2.5rem;
    }

    .sig-block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .sig-line { width: 100%; border-top: 0.5px solid #b0a07a; }
    .sig-label { font-size: 11px; color: #8b7640; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'DM Mono', monospace; }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 0.5px solid #e0d9c2;
    }

    .cert-id {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #a0906a;
    }

    .print-btn {
      background: #3a2e10;
      color: #fffef9;
      border: none;
      padding: 8px 20px;
      font-size: 13px;
      cursor: pointer;
      font-family: 'DM Mono', monospace;
      letter-spacing: 0.06em;
    }

    .share-btn {
      background: none;
      border: 0.5px solid #a0906a;
      color: #5c4e2a;
      padding: 8px 20px;
      font-size: 13px;
      cursor: pointer;
      font-family: 'DM Mono', monospace;
      letter-spacing: 0.06em;
    }

    .btn-row {
      display: flex;
      gap: 8px;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .certificate { border: 1px solid #ccc; page-break-inside: avoid; }
      .btn-row { display: none; }
    }
  </style>
</head>
<body>

<main class="certificate" role="main" aria-label="Auction result certificate">

  <div class="seal-row">
    <div class="seal" aria-hidden="true">BID<br>AUTH</div>
    <div>
      <div class="platform-name">Live Auction Platform</div>
      <div class="platform-sub">Official auction result certificate</div>
    </div>
  </div>

  <h1 class="cert-title">Certificate of Auction Result</h1>
  <p class="cert-subtitle">Auction ID · <%= auctionId %></p>

  <hr class="divider">

  <div class="field-grid">
    <div class="field-group wide">
      <span class="field-label">Item</span>
      <span class="field-value"><%= itemTitle %></span>
    </div>
    <div class="field-group wide">
      <span class="field-label">Description</span>
      <span class="field-value" style="font-size:15px;color:#4a3d18;"><%= itemDescription %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Winning bidder</span>
      <span class="field-value"><%= winnerName %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Seller</span>
      <span class="field-value"><%= sellerName %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Final price</span>
      <span class="field-value price"><%= finalPriceFmt %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Auction closed</span>
      <span class="field-value mono"><%= auctionEndTime %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Issued on</span>
      <span class="field-value mono"><%= issuedOn %></span>
    </div>
    <div class="field-group">
      <span class="field-label">Contact</span>
      <span class="field-value mono" style="font-size:13px;"><%= winnerEmail %></span>
    </div>
  </div>

  <output class="confirmation-banner">
    Delivery confirmed by the buyer. Escrow funds have been released to the seller.
    This certificate serves as proof of a completed, verified transaction.
  </output>

  <div class="sig-row" aria-hidden="true">
    <div class="sig-block">
      <div style="height:32px"></div>
      <div class="sig-line"></div>
      <div class="sig-label">Winner signature</div>
    </div>
    <div class="sig-block">
      <div style="height:32px"></div>
      <div class="sig-line"></div>
      <div class="sig-label">Platform seal</div>
    </div>
  </div>

  <div class="footer-row">
    <span class="cert-id"><%= certificateId %></span>
    <div class="btn-row">
      <button class="share-btn" onclick="navigator.clipboard && navigator.clipboard.writeText(window.location.href)">
        Copy link
      </button>
      <button class="print-btn" onclick="window.print()">
        Print / Save PDF
      </button>
    </div>
  </div>

</main>

</body>
</html>
