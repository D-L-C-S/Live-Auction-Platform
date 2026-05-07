import { useState, useEffect, useRef } from "react";
import { createAuction, getSellerListings, fetchEscrow, uploadImage } from "../services/api";

const STATUS_BADGE = {
  active:  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  closed:  "bg-gray-500/15 text-gray-400 border border-gray-500/30",
  settled: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

const ESCROW_BADGE = {
  pending:  "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  held:     "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  released: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
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
        auctionEndTime: `${form.endDate}T${form.endTime}:00.000Z`,
      });
      onSuccess(newAuction);
    } catch (err) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-5 uppercase tracking-wider">New listing</h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
          Item title *
        </label>
        <input
          className="input-dark w-full"
          value={form.title}
          onChange={set("title")}
          placeholder="e.g. Vintage Leica M3 Camera"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
          Description *
        </label>
        <textarea
          className="input-dark w-full min-h-[72px] resize-y"
          value={form.description}
          onChange={set("description")}
          placeholder="Condition, details, provenance…"
        />
      </div>

      {/* Image upload */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
          Item photo
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-xl p-6 flex items-center justify-center min-h-[120px] transition-all duration-150 cursor-pointer
            ${dragging
              ? "border-violet-500 bg-violet-500/5"
              : "border-[#3a3a5c] bg-[#1e1e2e] hover:border-violet-500/50 hover:bg-violet-500/5"
            }`}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="max-h-40 max-w-full rounded-lg object-cover" />
          ) : (
            <div className="text-center text-gray-600">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-sm">
                Drag &amp; drop or{' '}
                <span className="text-violet-400 font-medium">click to select</span>
              </div>
              <div className="text-xs mt-1 text-gray-700">PNG, JPG, WEBP up to 5 MB</div>
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
            className="mt-2 text-xs text-gray-500 hover:text-red-400 border border-[#2a2a3d] hover:border-red-500/40 px-3 py-1 rounded-lg transition-all duration-150"
          >
            Remove photo
          </button>
        )}
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            Starting price (₹) *
          </label>
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
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            Reserve price (₹)
          </label>
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            End date *
          </label>
          <input
            className="input-dark w-full"
            type="date"
            value={form.endDate}
            onChange={set("endDate")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            End time *
          </label>
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
        className="btn-gradient w-full py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Publishing…
          </span>
        ) : (
          "Publish listing"
        )}
      </button>
    </div>
  );
}

// ─── Escrow Badge ─────────────────────────────────────────────────────────────

function EscrowBadge({ status }) {
  const safe  = (status && status !== "null") ? status.toLowerCase() : "pending";
  const label = safe.charAt(0).toUpperCase() + safe.slice(1);
  const cls   = ESCROW_BADGE[safe] ?? ESCROW_BADGE.pending;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Listings Table ───────────────────────────────────────────────────────────

function ListingsTable({ listings }) {
  return (
    <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3d]">
              {["Item", "Starting", "Current bid", "Ends in", "Status", "Escrow"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-600 px-4 py-3 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((l, idx) => (
              <tr
                key={l.id}
                className={`border-b border-[#1e1e2e] hover:bg-[#1e1e2e]/60 transition-colors duration-100
                  ${idx === listings.length - 1 ? "border-b-0" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-gray-200 max-w-[200px] truncate">{l.title}</td>
                <td className="px-4 py-3 text-gray-400">{fmt(l.startingPrice)}</td>
                <td className={`px-4 py-3 font-semibold ${l.status === "active" ? "text-emerald-400" : "text-gray-400"}`}>
                  {fmt(l.currentBid)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.endsIn ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_BADGE[l.status] ?? STATUS_BADGE.closed}`}>
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
            Seller Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your listings and track sales</p>
        </div>
        <button
          onClick={() => setTab(tab === "create" ? "dashboard" : "create")}
          className={tab === "create"
            ? "text-sm font-medium text-gray-400 border border-[#2a2a3d] hover:border-[#3a3a5c] hover:text-gray-300 px-4 py-2 rounded-xl transition-all duration-150"
            : "btn-gradient px-4 py-2 rounded-xl text-sm"}
        >
          {tab === "create" ? "← Back" : "+ New listing"}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-6 animate-slide-down">
          ✓ {successMsg}
        </div>
      )}

      {tab === "dashboard" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Active listings", val: activeCount,        icon: "🟢" },
              { label: "Closed auctions", val: closedCount,        icon: "🔒" },
              { label: "Total settled",   val: fmt(totalSettled),  icon: "💰" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-5 hover-lift group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 uppercase tracking-wider">{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <div className="text-2xl font-bold text-gray-100 group-hover:text-violet-300 transition-colors">
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* Listings section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">My listings</h2>
          </div>

          {fetchLoading && (
            <div className="text-center py-12 text-gray-600 text-sm">
              <div className="w-8 h-8 border-2 border-[#2a2a3d] border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
              Loading listings…
            </div>
          )}
          {fetchError && !fetchLoading && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {fetchError}
            </div>
          )}
          {!fetchLoading && !fetchError && listings.length === 0 && (
            <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl px-6 py-12 text-center">
              <p className="text-gray-500 text-sm">No listings yet. Create your first one!</p>
            </div>
          )}
          {!fetchLoading && !fetchError && listings.length > 0 && (
            <ListingsTable listings={listings} />
          )}
        </>
      )}

      {tab === "create" && <CreateListingForm onSuccess={handleSuccess} />}
    </div>
  );
}
