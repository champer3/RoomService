/**
 * One-time fix for "dup key: { phoneNumber: null }" when signing up without a phone number.
 * The old unique index on phoneNumber was not sparse, so only one user could have null phoneNumber.
 * Run from backend folder: node scripts/fix-phoneNumber-index.js
 * Requires: .env with DATABASE set (same as server).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const raw = process.env.DATABASE || process.env.MONGODB_URI || process.env.DATABASE_LOCAL;
if (!raw) {
  console.error('Set DATABASE in .env');
  process.exit(1);
}
const db = raw.replace('<PASSWORD>', process.env.DATABASE_PASSWORD || '');

async function run() {
  await mongoose.connect(db, { dbName: 'RoomService' });
  const conn = mongoose.connection;
  const collection = conn.collection('users');
  try {
    const indexes = await collection.indexes();
    const hasPhone = indexes.some((i) => i.name === 'phoneNumber_1');
    if (hasPhone) {
      await collection.dropIndex('phoneNumber_1');
      console.log('Dropped old index phoneNumber_1');
    } else {
      console.log('No phoneNumber_1 index found (already fixed or never created)');
    }
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('Index phoneNumber_1 already missing');
    } else {
      throw e;
    }
  } finally {
    await mongoose.disconnect();
  }
  console.log('Done. Restart your server so Mongoose can create the new sparse unique index.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
