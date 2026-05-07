const mongoose = require('mongoose');

const connectDB = async () => {
  const rawUri = process.env.MONGO_URI || process.env.MONGO_URL || '';
  const mongoUri = rawUri.trim().replace(/^['"]|['"]$/g, '');

  if (!mongoUri) {
    console.error('MongoDB URI missing. Set MONGO_URI (or MONGO_URL) in service variables.');
    process.exit(1);
  }

  if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    console.error(`Invalid MongoDB URI scheme: "${mongoUri.slice(0, 40)}..."`);
    console.error('Expected URI to start with mongodb:// or mongodb+srv://');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
