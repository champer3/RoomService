/**
 * 1) Deletes placeholder products (sku starting with SEED-DEPT-).
 * 2) Reassigns existing products to Food / Grocery / Household with counts
 *    29 / 20 / 9 (when enough products), each count spread evenly across that
 *    department's categories; which product lands in which category is random.
 *
 * If fewer than 58 products remain, uses the same 29:20:9 ratio (largest remainder).
 * Products beyond the reassigned pool are left unchanged.
 *
 * Usage (from backend/):
 *   node scripts/seedDepartmentProducts.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const Department = require('../Models/departmentModel');
const Category = require('../Models/categoryModel');
const Product = require('../Models/productModel');

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

const SEED_SKU_PREFIX = 'SEED-DEPT-';

/** Ideal counts per department slug (used when product pool has at least this many). */
const IDEAL = { food: 29, grocery: 20, household: 9 };
const IDEAL_TOTAL = IDEAL.food + IDEAL.grocery + IDEAL.household;

/**
 * @param {number} total
 * @param {number} numBuckets
 * @returns {number[]}
 */
function distributeEvenly(total, numBuckets) {
  if (numBuckets <= 0) {
    throw new Error('At least one category is required per department');
  }
  const base = Math.floor(total / numBuckets);
  const rem = total % numBuckets;
  const out = [];
  for (let i = 0; i < numBuckets; i += 1) {
    out.push(base + (i < rem ? 1 : 0));
  }
  return out;
}

/** Split nTotal across buckets with ratio weights (Hamilton / largest remainder). */
function allocateByRatio(nTotal, weights) {
  const W = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / W) * nTotal);
  const floors = exact.map((x) => Math.floor(x));
  let rem = nTotal - floors.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, f: x - floors[i] })).sort((a, b) => b.f - a.f);
  const out = [...floors];
  for (let k = 0; k < rem; k += 1) {
    out[order[k].i] += 1;
  }
  return out;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {import('mongoose').Types.ObjectId[]} productIds
 * @param {{ _id: import('mongoose').Types.ObjectId }} department
 * @param {{ _id: import('mongoose').Types.ObjectId }[]} categories
 */
function buildUpdates(productIds, department, categories) {
  if (productIds.length === 0) return [];
  const counts = distributeEvenly(productIds.length, categories.length);
  const categorySlots = [];
  for (let i = 0; i < categories.length; i += 1) {
    for (let j = 0; j < counts[i]; j += 1) {
      categorySlots.push(categories[i]._id);
    }
  }
  shuffleInPlace(categorySlots);
  return productIds.map((pid, idx) => ({
    updateOne: {
      filter: { _id: pid },
      update: { $set: { department: department._id, category: categorySlots[idx] } },
    },
  }));
}

async function seedDepartmentProducts() {
  if (!DB) {
    // eslint-disable-next-line no-console
    console.error('DATABASE connection string is not defined in config.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(DB, { dbName: 'RoomService' });

    const removed = await Product.deleteMany({
      sku: { $regex: `^${SEED_SKU_PREFIX}` },
    });
    // eslint-disable-next-line no-console
    console.log(`Removed ${removed.deletedCount || 0} placeholder product(s) (${SEED_SKU_PREFIX}*).`);

    const allIds = (await Product.find({}).select('_id').lean()).map((d) => d._id);
    shuffleInPlace(allIds);

    const poolSize = Math.min(allIds.length, IDEAL_TOTAL);
    const poolIds = allIds.slice(0, poolSize);
    const untouched = allIds.length - poolSize;

    if (poolIds.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No products left to assign.');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    let nFood;
    let nGrocery;
    let nHousehold;
    if (poolSize === IDEAL_TOTAL) {
      nFood = IDEAL.food;
      nGrocery = IDEAL.grocery;
      nHousehold = IDEAL.household;
    } else {
      const parts = allocateByRatio(poolSize, [IDEAL.food, IDEAL.grocery, IDEAL.household]);
      [nFood, nGrocery, nHousehold] = parts;
    }

    const foodIds = poolIds.slice(0, nFood);
    const groceryIds = poolIds.slice(nFood, nFood + nGrocery);
    const householdIds = poolIds.slice(nFood + nGrocery);

    const slugOrder = ['food', 'grocery', 'household'];
    const counts = { food: nFood, grocery: nGrocery, household: nHousehold };
    const idSlices = { food: foodIds, grocery: groceryIds, household: householdIds };

    const bulkOps = [];

    for (const slug of slugOrder) {
      const department = await Department.findOne({ slug, isActive: true }).lean();
      if (!department) {
        throw new Error(`Department "${slug}" not found or inactive.`);
      }
      const categories = await Category.find({ department: department._id, isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .lean();
      if (categories.length === 0) {
        throw new Error(`Department "${slug}" has no active categories.`);
      }
      const n = counts[slug];
      if (n === 0) continue;
      const dist = distributeEvenly(n, categories.length);
      // eslint-disable-next-line no-console
      console.log(
        `${department.name} (${slug}): ${n} products → ${categories.length} categories [${dist.join(', ')}] (order shuffled)`
      );
      bulkOps.push(...buildUpdates(idSlices[slug], department, categories));
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { ordered: false });
    }

    // eslint-disable-next-line no-console
    console.log(`\nUpdated ${bulkOps.length} product(s).`);
    if (untouched > 0) {
      // eslint-disable-next-line no-console
      console.log(`Left ${untouched} product(s) unchanged (beyond pool of ${poolSize}).`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('seedDepartmentProducts failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

seedDepartmentProducts();
