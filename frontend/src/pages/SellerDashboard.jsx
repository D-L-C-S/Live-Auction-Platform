import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createAuction, getSellerListings, fetchEscrow, uploadImage } from "../services/api";

const STATUS_STYLE = {
  active:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed:  "bg-[#1a1a1a] text-[#999] border-[#2e2e2e]",
  settled: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const ESCROW_STYLE = {
  pending:  "bg-[#1a1a1a] text-[#999] border-[#2e2e2e]",
  held:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  released: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// ─── Create Listing Form ──────────────────────────────────────────────────────

function CreateListingForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "", description: "",
    startingPrice: "", reservePrice: "",
    endDate: "", endTime: "",
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const fileInputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.description.trim() || !form.startingPrice || !form.endDate || !form.endTime) {
      setError("Title, description, starting price, and auction end date/time are required.");
      return;
    }
    setLoading(true);
    try {
      let images = [];
      if (imageFile) {
        const url = await uploadImage(imageFile);
        images = [url];
      }
      const newAuction = await createAuction({
        title:          form.title,
        description:    form.description,
        images,
        startingPrice:  Number(form.startingPrice),
        reservePrice:   form.reservePrice ? Number(form.reservePrice) : null,
        auctionEndTime: new Date(`${form.endDate}T${form.endTime}`).toISOString(),
      });
      onSuccess(newAuction);
    } catch (err) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#111] border border-[#2e2e2e] rounded-xl p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999] mb-6">
        New listing
      </p>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]
                        px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="field-label">Item title *</label>
          <input
            className="input-dark w-full"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Vintage Leica M3 Camera"
          />
        </div>

        {/* Description */}
        <div>
          <label className="field-label">Description *</label>
          <textarea
            className="input-dark w-full min-h-[80px] resize-y"
            value={form.description}
            onChange={set("description")}
            placeholder="Condition, details, provenance…"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="field-label">Item photo</label>
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-xl p-6 flex items-center
                        justify-center min-h-[110px] transition-all duration-150 cursor-pointer
              ${dragging
                ? "border-cyan-400/40 bg-cyan-400/5"
                : "border-[#2e2e2e] bg-[#0a0a0a] hover:border-[#2e2e2e]"
              }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview"
                   className="max-h-36 max-w-full rounded-lg object-cover" />
            ) : (
              <div className="text-center text-[#888]">
                <svg className="w-8 h-8 mx-auto mb-2 text-[#999]" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-[13px]">
                  Drag & drop or{" "}
                  <span className="text-[#888] font-medium">click to upload</span>
                </div>
                <div className="text-[11px] text-[#999] mt-1">PNG, JPG, WEBP · max 5 MB</div>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {imagePreview && (
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="mt-2 text-[12px] text-[#888] hover:text-red-400 border border-[#2e2e2e]
                         hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Price row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Starting price (₹) *</label>
            <input
              className="input-dark w-full"
              type="number"
              min="0"
              value={form.startingPrice}
              onChange={set("startingPrice")}
              placeholder="5000"
            />
          </div>
          <div>
            <label className="field-label">Reserve price (₹)</label>
            <input
              className="input-dark w-full"
              type="number"
              min="0"
              value={form.reservePrice}
              onChange={set("reservePrice")}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Date/Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">End date *</label>
            <input
              className="input-dark w-full"
              type="date"
              value={form.endDate}
              onChange={set("endDate")}
            />
          </div>
          <div>
            <label className="field-label">End time *</label>
            <input
              className="input-dark w-full"
              type="time"
              value={form.endTime}
              onChange={set("endTime")}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full py-2.5 rounded-xl text-[13px] mt-1"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#080808]/30 border-t-[#080808]
                               rounded-full animate-spin" />
              Publishing…
            </span>
          ) : (
            "Publish listing"
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Listings Table ───────────────────────────────────────────────────────────

function ListingsTable({ listings }) {
  return (
    <div className="bg-[#111] border border-[#2e2e2e] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#222]">
              {["Item", "Starting", "Current bid", "Ends in", "Status", "Escrow"].map((h) => (
                <th key={h}
                    className="text-left text-[10px] font-medium uppercase tracking-[0.1em]
                               text-[#888] px-4 py-3.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((l, idx) => (
              <tr
                key={l.id}
                className={`border-b border-[#0e0e0e] hover:bg-[#111] transition-colors duration-100
                  ${idx === listings.length - 1 ? "border-b-0" : ""}`}
              >
                <td className="px-4 py-3.5 font-medium text-[#e0e0e0] max-w-[180px] truncate">
                  {l.title}
                </td>
                <td className="px-4 py-3.5 text-[#999] tabular-nums">{fmt(l.startingPrice)}</td>
                <td className={`px-4 py-3.5 font-semibold tabular-nums
                  ${l.status === "active" ? "text-white" : "text-[#999]"}`}>
                  {fmt(l.currentBid)}
                </td>
                <td className="px-4 py-3.5 font-mono text-[12px] text-[#888]">
                  {l.endsIn ?? "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold
                                   uppercase tracking-[0.08em] border
                                   ${STATUS_STYLE[l.status] ?? STATUS_STYLE.closed}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <EscrowBadge status={l.escrowStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EscrowBadge({ status }) {
  const safe  = (status && status !== "null") ? status.toLowerCase() : "pending";
  const label = safe.charAt(0).toUpperCase() + safe.slice(1);
  const cls   = ESCROW_STYLE[safe] ?? ESCROW_STYLE.pending;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold
                     uppercase tracking-[0.08em] border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeUntil(isoString) {
  if (!isoString) return null;
  const diff = new Date(isoString) - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((diff % 36e5) / 6e4)}m`;
}

function toRow(a) {
  return {
    id:            a._id,
    title:         a.title,
    startingPrice: a.startingPrice,
    currentBid:    a.currentHighestBid ?? a.startingPrice,
    endsIn:        timeUntil(a.endTime),
    status:        a.status ?? "active",
    escrowStatus:  null,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const [tab,          setTab]          = useState("dashboard");
  const [listings,     setListings]     = useState([]);
  const [fetchError,   setFetchError]   = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMsg,   setSuccessMsg]   = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw  = await getSellerListings();
        const rows = (Array.isArray(raw) ? raw : []).map(toRow);
        setListings(rows);

        const needsEscrow   = rows.filter((r) => r.status !== "active");
        const escrowResults = await Promise.allSettled(
          needsEscrow.map((r) => fetchEscrow(r.id))
        );
        escrowResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const escrowStatus = result.value?.status ?? null;
            setListings((prev) =>
              prev.map((l) =>
                l.id === needsEscrow[i].id ? { ...l, escrowStatus } : l
              )
            );
          }
        });
      } catch (err) {
        setFetchError(err.message || "Failed to load listings.");
      } finally {
        setFetchLoading(false);
      }
    })();
  }, []);

  const handleSuccess = (newAuction) => {
    setListings((prev) => [toRow(newAuction), ...prev]);
    setSuccessMsg(`"${newAuction.title}" is now live.`);
    setTab("dashboard");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const activeCount  = listings.filter((l) => l.status === "active").length;
  const closedCount  = listings.filter((l) => l.status !== "active").length;
  const totalSettled = listings.filter((l) => l.status === "settled").reduce((s, l) => s + l.currentBid, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between mb-10 gap-4"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#888] mb-3">
            Seller
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
            Dashboard
          </h1>
          <p className="text-[13px] text-[#999] mt-2">
            Manage your listings and track sales
          </p>
        </div>
        <button
          onClick={() => setTab(tab === "create" ? "dashboard" : "create")}
          className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all
            ${tab === "create"
              ? "border border-[#2e2e2e] text-[#999] hover:text-white hover:border-[#3a3a3a]"
              : "bg-white text-[#080808] hover:bg-[#e8e8e8] active:scale-[0.98]"}`}
        >
          {tab === "create" ? "← Back" : "+ New listing"}
        </button>
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-500/8 border border-emerald-500/20 text-emerald-400
                       text-[13px] px-4 py-3 rounded-xl mb-6 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {tab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Stats row */}
            <div className="flex items-center gap-8 mb-10 pb-8 border-b border-[#222]">
              {[
                { label: "Active listings", val: activeCount },
                { label: "Closed auctions", val: closedCount },
                { label: "Total settled",   val: fmt(totalSettled) },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <div>
                    <p className="text-2xl font-bold tracking-[-0.03em] text-white">{s.val}</p>
                    <p className="text-[11px] text-[#888] uppercase tracking-[0.08em] mt-0.5">
                      {s.label}
                    </p>
                  </div>
                  {i < 2 && <div className="w-px h-8 bg-[#2a2a2a]" />}
                </React.Fragment>
              ))}
            </div>

            {/* Listings section */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999]">
                My listings
              </h2>
              <span className="text-[11px] text-[#999]">{listings.length} total</span>
            </div>

            {fetchLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-[#2e2e2e] border-t-[#555] rounded-full animate-spin" />
              </div>
            )}

            {fetchError && !fetchLoading && (
              <div className="bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]
                              px-4 py-3 rounded-xl">
                {fetchError}
              </div>
            )}

            {!fetchLoading && !fetchError && listings.length === 0 && (
              <div className="bg-[#111] border border-[#2e2e2e] rounded-xl px-6 py-14 text-center">
                <p className="text-[#888] text-[13px]">No listings yet.</p>
                <button
                  onClick={() => setTab("create")}
                  className="mt-4 text-[12px] font-medium text-[#888] border border-[#2e2e2e]
                             px-4 py-2 rounded-lg hover:text-white hover:border-[#3a3a3a]
                             transition-all duration-150"
                >
                  Create your first listing →
                </button>
              </div>
            )}

            {!fetchLoading && !fetchError && listings.length > 0 && (
              <ListingsTable listings={listings} />
            )}
          </motion.div>
        )}

        {tab === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CreateListingForm onSuccess={handleSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
