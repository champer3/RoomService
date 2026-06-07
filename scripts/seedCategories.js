const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Department = require('../Models/departmentModel');
const Category = require('../Models/categoryModel');

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

if (!DB) {
  // eslint-disable-next-line no-console
  console.error('DATABASE connection string is not defined in .env');
  process.exit(1);
}

async function upsertCategory(departmentSlug, category) {
  const dept = await Department.findOne({ slug: departmentSlug });
  if (!dept) {
    // eslint-disable-next-line no-console
    console.warn(
      `Skipping category ${category.name} – department ${departmentSlug} not found`
    );
    return;
  }

  await Category.findOneAndUpdate(
    { department: dept._id, slug: category.slug },
    {
      department: dept._id,
      ...category,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedCategories() {
  try {
    await mongoose.connect(DB, {
      dbName: 'RoomService',
    });

    // Use the existing admin asset Logo as a placeholder icon/image
    const defaultIcon = '/assets/Logo.png';

    // Food categories
    const foodCategories = [
      { name: 'Chef Specials', slug: 'chef-specials', displayOrder: 1 },
      { name: 'Bowls', slug: 'bowls', displayOrder: 2 },
      { name: 'Pasta', slug: 'pasta', displayOrder: 3 },
      { name: 'Snacks', slug: 'snacks', displayOrder: 4 },
      { name: 'Drinks', slug: 'drinks', displayOrder: 5 },
    ].map((c) => ({ ...c, iconUrl: defaultIcon, imageUrl: defaultIcon }));

    for (const cat of foodCategories) {
      await upsertCategory('food', cat);
    }

    // Grocery categories
    const groceryCategories = [
      { name: 'Fruits', slug: 'fruits', displayOrder: 1 },
      { name: 'Vegetables', slug: 'vegetables', displayOrder: 2 },
      { name: 'Dairy', slug: 'dairy', displayOrder: 3 },
      { name: 'Snacks', slug: 'snacks', displayOrder: 4 },
      { name: 'Frozen', slug: 'frozen', displayOrder: 5 },
    ].map((c) => ({ ...c, iconUrl: defaultIcon, imageUrl: defaultIcon }));

    for (const cat of groceryCategories) {
      await upsertCategory('grocery', cat);
    }

    // Household categories
    const householdCategories = [
      { name: 'Cleaning', slug: 'cleaning', displayOrder: 1 },
      { name: 'Laundry', slug: 'laundry', displayOrder: 2 },
      { name: 'Bathroom', slug: 'bathroom', displayOrder: 3 },
      { name: 'Kitchen', slug: 'kitchen', displayOrder: 4 },
    ].map((c) => ({ ...c, iconUrl: defaultIcon, imageUrl: defaultIcon }));

    for (const cat of householdCategories) {
      await upsertCategory('household', cat);
    }

    // eslint-disable-next-line no-console
    console.log('Seeded categories successfully.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding categories:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedCategories();

