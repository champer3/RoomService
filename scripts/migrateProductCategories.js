/**
 * One-off migration: map products with string `category` to Category ObjectIds.
 * - Loads all categories and builds a lookup by normalized name (trim + lowercase).
 * - Finds products whose category field is a string and updates them to the matching Category _id.
 * - If multiple categories share the same name, the first one found is used.
 *
 * Run from backend: node scripts/migrateProductCategories.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../Models/categoryModel');
const Department = require('../Models/departmentModel');

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

if (!DB) {
  console.error('DATABASE connection string is not defined in .env');
  process.exit(1);
}

function normalizeName(str) {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

async function run() {
  try {
    await mongoose.connect(DB, { dbName: 'RoomService' });
    console.log('Connected to DB');

    const categories = await Category.find().populate('department', 'slug').lean();
    const byName = new Map();
    const byDeptSlug = new Map(); // slug -> first category (by displayOrder)
    for (const cat of categories) {
      const key = normalizeName(cat.name);
      if (key && !byName.has(key)) byName.set(key, cat);
      const slug = cat.department?.slug || '';
      if (slug && !byDeptSlug.has(slug)) byDeptSlug.set(slug, cat);
    }
    // Sort by displayOrder so "first" is deterministic
    const byDisplayOrder = await Category.find().sort({ displayOrder: 1 }).populate('department', 'slug').lean();
    byDisplayOrder.forEach((cat) => {
      const slug = cat.department?.slug || '';
      if (slug) byDeptSlug.set(slug, cat);
    });
    console.log(`Loaded ${categories.length} categories, ${byName.size} unique names, ${byDeptSlug.size} dept slugs`);

    const collection = mongoose.connection.db.collection('products');
    const cursor = collection.find({});
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const unmapped = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      processed++;

      const catVal = doc.category;
      if (catVal === null || catVal === undefined) {
        unmapped.push({ id: doc._id, title: doc.title, reason: 'missing' });
        skipped++;
        continue;
      }

      if (catVal instanceof mongoose.Types.ObjectId) {
        skipped++;
        continue;
      }

      if (typeof catVal !== 'string') {
        unmapped.push({ id: doc._id, title: doc.title, value: catVal, reason: 'not a string' });
        skipped++;
        continue;
      }

      const str = catVal.trim();
      // Valid 24-char hex ObjectId string -> use as ObjectId
      if (/^[a-fA-F0-9]{24}$/.test(str)) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { category: new mongoose.Types.ObjectId(str) } }
        );
        updated++;
        continue;
      }
      const key = normalizeName(str);
      let category = key ? byName.get(key) : null;
      if (!category && key) category = byDeptSlug.get(key) || null;
      if (!category) {
        unmapped.push({ id: doc._id, title: doc.title, value: str, reason: 'no matching category' });
        skipped++;
        continue;
      }

      await collection.updateOne(
        { _id: doc._id },
        { $set: { category: category._id } }
      );
      updated++;
    }

    console.log(`Processed ${processed} products`);
    console.log(`Updated ${updated} products (string category -> Category ObjectId)`);
    console.log(`Skipped ${skipped} (already ObjectId or unmapped)`);
    if (unmapped.length > 0) {
      console.log('\nUnmapped (review manually):');
      unmapped.forEach((u) => console.log(`  _id: ${u.id}, title: ${u.title}, value: ${u.value || u.reason}`));
    }
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
