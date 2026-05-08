# JSP Documents

Jakarta EE pages for printable auction documents. Served by a separate servlet container (e.g. Apache Tomcat 10+) and are not part of the Node/Vite servers.

> **No Tomcat?** The React frontend has equivalent pages at `/receipt` and `/certificate` that read the same query parameters and render identical content. Use those during development.

## Pages

### `payment-receipt.jsp`

Printable payment receipt shown to the buyer after escrow is released.

| Query Param | Description | Fallback |
| --- | --- | --- |
| `transactionId` | Stripe PaymentIntent ID | Random `TXN-XXXXXXXX` |
| `auctionId` | Auction document `_id` | `AUC-PENDING` |
| `itemName` | Auction title | `Auction Item` |
| `amountPaid` | Final settled amount (no currency symbol) | `0.00` |

Includes a **Print / Save PDF** button. The `@media print` stylesheet hides the button and removes backgrounds for clean PDF output.

### `auction-certificate.jsp`

Printable auction result certificate issued after a completed transaction.

| Query Param | Description | Fallback |
| --- | --- | --- |
| `auctionId` | Auction document `_id` | `DEMO` |
| `itemTitle` | Auction title | `Auction Item` |
| `itemDesc` | Auction description | `—` |
| `winnerName` | Winner's display name | `Winner` |
| `winnerEmail` | Winner's email address | `—` |
| `sellerName` | Seller's display name | `Seller` |
| `finalPrice` | Winning bid amount (numeric) | `0` |
| `auctionEndTime` | Auction close timestamp | `—` |
| `certificateId` | Certificate ID | Derived from `auctionId.hashCode()` |

Fields are read from request attributes first, then query params as fallback — supports both servlet-forwarded and direct URL access.

## Deployment

`WEB-INF/web.xml` is configured with Jakarta EE 10 servlet mappings:
- `/certificate` → `auction-certificate.jsp`
- `/receipt` → `payment-receipt.jsp`

To deploy:

1. Package the `jsp/` directory as a `.war` file or deploy as an exploded webapp to Tomcat 10+.
2. The Node backend and Vite frontend do not need to know about Tomcat's port — the frontend links directly to the JSP URLs.
