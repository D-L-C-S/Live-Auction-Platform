import { useState, useEffect, useRef } from "react";
import { createAuction, getSellerListings, fetchEscrow, uploadImage } from "../services/api";

const STATUS_STYLES = {
  active:  { bg: "#ecfdf5", color: "#166534" },
  closed:  { bg: "#f3f4f6", color: "#4b5563" },
  settled: { bg: "#eff6ff", color: "#1e40af" },
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        title: form.title,
        description: form.description,
        images,
        startingPrice: Number(form.startingPrice),
        reservePrice: form.reservePrice ? Number(form.reservePrice) : null,
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
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>New listing</span>
      </div>

      {error && <div style={styles.errorBar}>{error}</div>}

      <div style={styles.fieldFull}>
        <label style={styles.label}>Item title *</label>
        <input style={styles.input} value={form.title} onChange={set("title")} placeholder="e.g. Vintage Leica M3 Camera" />
      </div>

      <div style={styles.fieldFull}>
        <label style={styles.label}>Description *</label>
        <textarea style={{ ...styles.input, minHeight: 72, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Condition, details, provenance..." />
      </div>

      <div style={styles.fieldFull}>
        <label style={styles.label}>Item photo</label>
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            ...styles.dropZone,
            borderColor: dragging ? "#6366f1" : "#d1d5db",
            background: dragging ? "#eef2ff" : "#f9fafb",
          }}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="preview" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13 }}>Drag & drop or <span style={{ color: "#6366f1", fontWeight: 500 }}>click to select</span></div>
              <div style={{ fontSize: 11, marginTop: 4 }}>PNG, JPG, WEBP up to 5 MB</div>
            </div>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        {imagePreview && (
          <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ ...styles.btnOutline, marginTop: 6, fontSize: 11, padding: "4px 10px" }}>
            Remove photo
          </button>
        )}
      </div>

      <div style={styles.row}>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>Starting price (₹) *</label>
          <input style={styles.input} type="number" min="0" value={form.startingPrice} onChange={set("startingPrice")} placeholder="5000" />
        </div>
        <div style={styles.fieldHalf}>
          <label style={styles.label}>Reserve price (₹)</label>
          <input style={styles.input} type="number" min="0" value={form.reservePrice} onChange={set("reservePrice")} placeholder="Optional — auction won't sell below this" />
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

      <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </div>
  );
}

// ─── Escrow Badge ─────────────────────────────────────────────────────────────

const ESCROW_STYLES = {
  pending:  { background: "#fefce8", color: "#854d0e" },
  held:     { background: "#fff7ed", color: "#9a3412" },
  released: { background: "#ecfdf5", color: "#166534" },
};

function EscrowBadge({ status }) {
  const safe  = (status && status !== "null") ? status.toLowerCase() : "pending";
  const label = safe.charAt(0).toUpperCase() + safe.slice(1);
  const style = ESCROW_STYLES[safe] ?? ESCROW_STYLES.pending;
  return <span style={{ ...styles.badge, ...style }}>{label}</span>;
}

// ─── Listings Table ───────────────────────────────────────────────────────────

function ListingsTable({ listings }) {
  return (
    <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Item", "Starting", "Current bid", "Ends in", "Status", "Escrow"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td style={{ ...styles.td, fontWeight: 500 }}>{l.title}</td>
              <td style={styles.td}>{fmt(l.startingPrice)}</td>
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
              <td style={styles.td}>
                <EscrowBadge status={l.escrowStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helper: compute a human-readable "ends in" string from an ISO timestamp ──

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
  const [tab, setTab] = useState("dashboard");
  const [listings, setListings] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw  = await getSellerListings();
        const rows = (Array.isArray(raw) ? raw : []).map(toRow);
        setListings(rows);

        const needsEscrow = rows.filter((r) => r.status !== "active");
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
          {fetchLoading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              Loading listings…
            </div>
          )}
          {fetchError && !fetchLoading && (
            <div style={styles.errorBar}>{fetchError}</div>
          )}
          {!fetchLoading && !fetchError && <ListingsTable listings={listings} />}
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
  label: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 4, display: "block" },
  input: { fontSize: 13, padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: 8, background: "#fff", color: "#111827", width: "100%", boxSizing: "border-box" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fieldFull: { marginBottom: 12 },
  fieldHalf: {},
  dropZone: { width: "100%", border: "1.5px dashed #d1d5db", borderRadius: 10, padding: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, transition: "border-color 0.15s, background 0.15s", boxSizing: "border-box", background: "none" },
  btnPrimary: { background: "#111827", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" },
  btnOutline: { fontSize: 12, fontWeight: 500, padding: "7px 14px", border: "0.5px solid #d1d5db", borderRadius: 8, background: "none", color: "#111827", cursor: "pointer" },
  successBar: { background: "#ecfdf5", border: "0.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", marginBottom: "1rem" },
  errorBar: { background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: "1rem" },
};
