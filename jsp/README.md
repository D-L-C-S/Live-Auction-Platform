# JSP Documents

Jakarta EE pages for printable auction documents. These are served by a separate servlet container (e.g. Apache Tomcat) and are not part of the Node/Vite servers.

## Pages

### `payment-receipt.jsp`

Printable payment receipt shown to the buyer after funds are released from escrow.

Linked from the Bidder Dashboard once `escrowStatus === 'released'`:

```
/jsp/payment-receipt.jsp?auctionId=…&transactionId=…&itemName=…&amountPaid=…
```

| Query Param | Description | Fallback |
| --- | --- | --- |
| `transactionId` | Stripe PaymentIntent or transfer ID | Random `TXN-XXXXXXXX` |
| `auctionId` | Auction document `_id` | `AUC-PENDING` |
| `itemName` | Auction title | `Auction Item` |
| `amountPaid` | Final settled amount (no currency symbol) | `0.00` |

Includes a **Print / Save PDF** button. The `@media print` stylesheet hides the button and removes backgrounds for clean PDF output.

### `auction-certificate.jsp`

Printable auction result certificate. **Not yet implemented** — stub file only.

Planned query params (to be confirmed):

| Query Param | Description |
| --- | --- |
| `auctionId` | Auction document `_id` |
| `itemName` | Auction title |
| `winnerName` | Winner's display name |
| `finalAmount` | Winning bid amount |
| `closedAt` | Auction close timestamp |

## Deployment

These pages require a Jakarta EE servlet container. `WEB-INF/web.xml` (not yet configured) will define the servlet mappings.

Example Tomcat deployment:

1. Package the `jsp/` directory as a `.war` file or deploy it as an exploded webapp.
2. Map `/certificate` → `auction-certificate.jsp` and `/receipt` → `payment-receipt.jsp` in `web.xml`.
3. The Node backend and Vite frontend do not need to know about Tomcat's port — the frontend links directly to the JSP URLs.
