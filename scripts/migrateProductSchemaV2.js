/**
 * One-off: remove legacy product fields after schema v2.
 * Run: node backend/scripts/migrateProductSchemaV2.js (from repo root or backend)
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const LEGACY_KEYS = [
  'Brand',
  'brand',
  'subCategory',
  'nutrients',
  'options',
  'related',
  'components',
  'extra',
  'instructions',
  'oldPrice',
];

async function run() {
  const DB = process.env.DATABASE
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD || '')
    : null;
  if (!DB) {
    console.error('DATABASE is not defined in .env');
    process.exit(1);
  }
  await mongoose.connect(DB, { dbName: process.env.DB_NAME || 'RoomService' });
  const col = mongoose.connection.db.collection('products');
  const unset = {};
  LEGACY_KEYS.forEach((k) => {
    unset[k] = '';
  });
  const withRelated = await col
    .find({ 'related.0': { $exists: true } })
    .project({ related: 1, tags: 1 })
    .toArray();
  let copied = 0;
  for (const d of withRelated) {
    if (!d.tags?.length && Array.isArray(d.related) && d.related.length) {
      await col.updateOne({ _id: d._id }, { $set: { tags: d.related } });
      copied += 1;
    }
  }
  if (copied) console.log(`Copied related -> tags: ${copied} documents`);

  const r = await col.updateMany({}, { $unset: unset });
  console.log(`Unset legacy keys on products: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
