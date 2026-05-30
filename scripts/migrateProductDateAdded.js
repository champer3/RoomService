/**
 * One-off migration: set dateAdded to today's date for all products.
 * Use after adding the dateAdded field to the product model.
 *
 * Run from backend: node scripts/migrateProductDateAdded.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

if (!DB) {
  console.error('DATABASE connection string is not defined in config.env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(DB, { dbName: 'RoomService' });
    console.log('Connected to DB');

    const collection = mongoose.connection.db.collection('products');
    const today = new Date();

    const result = await collection.updateMany(
      {},
      { $set: { dateAdded: today } }
    );

    console.log(`Updated dateAdded to ${today.toISOString()} for ${result.modifiedCount} products (matched: ${result.matchedCount})`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

run();
