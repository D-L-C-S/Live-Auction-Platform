<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    h1 { color: #2c7a2c; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
    th { background: #f4f4f4; }
    .total { font-weight: bold; font-size: 1.1em; }
    .footer { margin-top: 30px; font-size: 0.8em; color: #888; }
  </style>
</head>
<body>
  <h1>Payment Receipt</h1>

  <table>
    <tr><th>Receipt No.</th><td>${param.receiptId}</td></tr>
    <tr><th>Auction ID</th><td>${param.auctionId}</td></tr>
    <tr><th>Item</th><td>${param.title}</td></tr>
    <tr><th>Buyer</th><td>${param.buyerName}</td></tr>
    <tr><th>Seller</th><td>${param.sellerName}</td></tr>
    <tr><th>Amount Paid</th><td class="total">$${param.amount}</td></tr>
    <tr><th>Payment Method</th><td>Stripe (Escrow)</td></tr>
    <tr><th>Status</th><td>${param.status}</td></tr>
    <tr><th>Date</th><td>${param.paidAt}</td></tr>
  </table>

  <div class="footer">
    Funds are held in escrow and released to the seller upon delivery confirmation.
    For disputes, contact support@liveauction.example.com.
  </div>
</body>
</html>
