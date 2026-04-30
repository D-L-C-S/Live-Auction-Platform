const fs = require('node:fs/promises');
const path = require('node:path');
const Auction = require('../models/Auction');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function cleanOrphanedUploads() {
  let files;
  try {
    files = await fs.readdir(UPLOADS_DIR);
  } catch {
    return;
  }

  const uploadedFiles = files.filter((f) => f !== '.gitkeep');
  if (uploadedFiles.length === 0) return;

  const auctions = await Auction.find({ images: { $exists: true, $ne: [] } }).select('images').lean();
  const referenced = new Set(
    auctions.flatMap((a) => a.images.map((url) => path.basename(url)))
  );

  for (const file of uploadedFiles) {
    if (!referenced.has(file)) {
      await fs.unlink(path.join(UPLOADS_DIR, file)).catch(() => {});
    }
  }
}

module.exports = { cleanOrphanedUploads };
