import React from 'react';
import { useSearchParams } from 'react-router-dom';

function formatDate() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function PaymentReceiptPage() {
  const [params] = useSearchParams();

  const transactionId = params.get('transactionId') || ('TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase());
  const auctionId     = params.get('auctionId')     || 'AUC-PENDING';
  const itemName      = params.get('itemName')      || 'Auction Item';
  const amountPaid    = params.get('amountPaid')    || '0';

  const rows = [
    { label: 'Transaction Reference', value: transactionId },
    { label: 'Auction ID',            value: auctionId },
    { label: 'Item Description',      value: itemName },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-md border-t-8 border-blue-600 px-10 py-10">

        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-100 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Payment Receipt</h1>
            <p className="text-sm text-gray-500 mt-1">Generated on {formatDate()}</p>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-bold uppercase
                           tracking-wide px-3 py-1.5 rounded-full">
            Paid via Stripe
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-4 mb-6">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900 text-right max-w-[55%] break-all">{value}</span>
            </div>
          ))}
        </div>

        <hr className="border-gray-200 my-6" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-700">Total Settled</span>
          <span className="text-3xl font-bold text-blue-600">
            ₹{Number(amountPaid).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Print button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => window.print()}
            className="bg-gray-100 text-gray-700 border border-gray-300 px-5 py-2.5
                       rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 leading-relaxed">
          This document serves as proof that funds have been released from the platform's escrow
          service to the seller following delivery confirmation.
          <br />© BidMaster Live Auction Platform
        </p>
      </div>
    </div>
  );
}
