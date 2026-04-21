<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Auction Result Certificate</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; border: 2px solid #333; }
    h1 { text-align: center; letter-spacing: 2px; }
    .field { margin: 12px 0; }
    .label { font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; font-size: 0.85em; color: #555; }
  </style>
</head>
<body>
  <h1>Auction Result Certificate</h1>
  <hr/>

  <div class="field"><span class="label">Auction ID:</span> ${param.auctionId}</div>
  <div class="field"><span class="label">Item:</span> ${param.title}</div>
  <div class="field"><span class="label">Seller:</span> ${param.sellerName}</div>
  <div class="field"><span class="label">Winner:</span> ${param.winnerName}</div>
  <div class="field"><span class="label">Winning Bid:</span> $${param.finalPrice}</div>
  <div class="field"><span class="label">Auction Closed:</span> ${param.closedAt}</div>

  <hr/>
  <div class="footer">
    This certificate confirms the result of the above auction conducted on the Live Auction Platform.
  </div>
</body>
</html>
