<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.text.SimpleDateFormat" %>
<%@ page import="java.util.Date" %>
<%
    // Safely grabbing parameters from the URL or request attributes
    String transactionId = request.getParameter("transactionId");
    String auctionId = request.getParameter("auctionId");
    String itemName = request.getParameter("itemName");
    String amountPaid = request.getParameter("amountPaid");
    
    // Fallbacks to prevent null pointer exceptions if the URL is missing parameters
    if (transactionId == null || transactionId.isEmpty()) transactionId = "TXN-" + (int)(Math.random() * 100000000);
    if (auctionId == null || auctionId.isEmpty()) auctionId = "AUC-PENDING";
    if (itemName == null || itemName.isEmpty()) itemName = "Auction Item";
    if (amountPaid == null || amountPaid.isEmpty()) amountPaid = "0.00";

    SimpleDateFormat formatter = new SimpleDateFormat("MMMM dd, yyyy");
    String currentDate = formatter.format(new Date());
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Official Receipt - <%= transactionId %></title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.5;
            padding: 40px 20px;
            margin: 0;
            display: flex;
            justify-content: center;
        }
        .receipt-card {
            background-color: white;
            max-width: 600px;
            width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 40px;
            border-top: 8px solid #2563eb;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title h1 {
            margin: 0;
            font-size: 24px;
            color: #111827;
        }
        .title p {
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #6b7280;
        }
        .status {
            background-color: #d1fae5;
            color: #065f46;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 15px;
        }
        .row .label { color: #6b7280; }
        .row .value { font-weight: 500; color: #111827; }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 25px 0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 18px;
            font-weight: bold;
        }
        .total-row .value {
            font-size: 28px;
            color: #2563eb;
        }
        .actions {
            margin-top: 40px;
            text-align: center;
        }
        .print-btn {
            background-color: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .print-btn:hover { background-color: #e5e7eb; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }
        
        /* Ensures the background and buttons disappear when saving to PDF */
        @media print {
            body { background-color: white; padding: 0; }
            .receipt-card { box-shadow: none; border-top: 8px solid #000; padding: 0; }
            .actions { display: none; }
        }
    </style>
</head>
<body>

<div class="receipt-card">
    <div class="header">
        <div class="title">
            <h1>Payment Receipt</h1>
            <p>Generated on <%= currentDate %></p>
        </div>
        <div class="status">Paid via Stripe</div>
    </div>

    <div class="row">
        <span class="label">Transaction Reference</span>
        <span class="value"><%= transactionId %></span>
    </div>
    
    <div class="row">
        <span class="label">Auction ID</span>
        <span class="value"><%= auctionId %></span>
    </div>

    <div class="row">
        <span class="label">Item Description</span>
        <span class="value"><%= itemName %></span>
    </div>

    <div class="divider"></div>

    <div class="total-row">
        <span class="label">Total Settled</span>
        <span class="value">$<%= amountPaid %></span>
    </div>

    <div class="actions">
        <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
    </div>

    <div class="footer">
        <p>This document serves as proof that funds have been released from the platform's escrow service to the seller following delivery confirmation.</p>
        <p>&copy; Project 28 Live Auction Platform</p>
    </div>
</div>

</body>
</html>