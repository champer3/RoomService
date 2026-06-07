const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Department = require('../Models/departmentModel');

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

if (!DB) {
  // eslint-disable-next-line no-console
  console.error('DATABASE connection string is not defined in .env');
  process.exit(1);
}

async function seedDepartments() {
  try {
    await mongoose.connect(DB, {
      dbName: 'RoomService',
    });

    const seed = [
      {
        name: 'Food',
        slug: 'food',
        description: 'Prepared meals, drinks, and ready-to-eat items',
        displayOrder: 1,
        supportsVariants: true,
        tracksInventory: true,
        layoutPreset: 'food',
        categoryNavStyle: 'tabs',
      },
      {
        name: 'Grocery',
        slug: 'grocery',
        description: 'Fresh produce, pantry items, snacks, and beverages',
        displayOrder: 2,
        supportsVariants: false,
        tracksInventory: true,
        layoutPreset: 'grocery',
        categoryNavStyle: 'chips',
      },
      {
        name: 'Household',
        slug: 'household',
        description: 'Cleaning and home supply products',
        displayOrder: 3,
        supportsVariants: false,
        tracksInventory: true,
        layoutPreset: 'grocery',
        categoryNavStyle: 'grid',
      },
    ];

    for (const dept of seed) {
      await Department.findOneAndUpdate(
        { slug: dept.slug },
        dept,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // eslint-disable-next-line no-console
    console.log('Seeded departments successfully.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding departments:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDepartments();

