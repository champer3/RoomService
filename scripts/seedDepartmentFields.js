const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Department = require('../Models/departmentModel');
const DepartmentField = require('../Models/departmentFieldModel');

const DB = process.env.DATABASE
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : null;

if (!DB) {
  // eslint-disable-next-line no-console
  console.error('DATABASE connection string is not defined in .env');
  process.exit(1);
}

async function upsertField(departmentSlug, field) {
  const dept = await Department.findOne({ slug: departmentSlug });
  if (!dept) {
    // eslint-disable-next-line no-console
    console.warn(`Skipping field ${field.fieldKey} – department ${departmentSlug} not found`);
    return;
  }

  await DepartmentField.findOneAndUpdate(
    { department: dept._id, fieldKey: field.fieldKey },
    {
      department: dept._id,
      ...field,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedDepartmentFields() {
  try {
    await mongoose.connect(DB, {
      dbName: 'RoomService',
    });

    // Food fields
    const foodFields = [
      {
        fieldKey: 'ingredients',
        fieldLabel: 'Ingredients',
        fieldType: 'tags',
        isRequired: true,
        sortOrder: 1,
      },
      {
        fieldKey: 'prep_time',
        fieldLabel: 'Preparation Time (mins)',
        fieldType: 'number',
        isRequired: false,
        sortOrder: 2,
        placeholder: 'e.g. 15',
      },
      {
        fieldKey: 'calories',
        fieldLabel: 'Calories',
        fieldType: 'number',
        isRequired: false,
        sortOrder: 3,
        placeholder: 'e.g. 720',
      },
      {
        fieldKey: 'spice_level',
        fieldLabel: 'Spice Level',
        fieldType: 'select',
        isRequired: false,
        sortOrder: 4,
        options: [
          { label: 'Mild', value: 'mild' },
          { label: 'Medium', value: 'medium' },
          { label: 'Hot', value: 'hot' },
        ],
      },
    ];

    for (const field of foodFields) {
      await upsertField('food', field);
    }

    // Grocery fields
    const groceryFields = [
      {
        fieldKey: 'brand',
        fieldLabel: 'Brand',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 1,
      },
      {
        fieldKey: 'unit_size',
        fieldLabel: 'Unit / Size',
        fieldType: 'text',
        isRequired: true,
        sortOrder: 2,
      },
      {
        fieldKey: 'expiration_type',
        fieldLabel: 'Expiration Type',
        fieldType: 'select',
        isRequired: false,
        sortOrder: 3,
        options: [
          { label: 'Perishable', value: 'perishable' },
          { label: 'Non-perishable', value: 'non_perishable' },
        ],
      },
      {
        fieldKey: 'supplier',
        fieldLabel: 'Supplier',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
    ];

    for (const field of groceryFields) {
      await upsertField('grocery', field);
    }

    // Household fields
    const householdFields = [
      {
        fieldKey: 'brand',
        fieldLabel: 'Brand',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 1,
      },
      {
        fieldKey: 'unit_size',
        fieldLabel: 'Unit / Size',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 2,
      },
      {
        fieldKey: 'pack_count',
        fieldLabel: 'Pack Count',
        fieldType: 'number',
        isRequired: false,
        sortOrder: 3,
      },
      {
        fieldKey: 'supplier',
        fieldLabel: 'Supplier',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
    ];

    for (const field of householdFields) {
      await upsertField('household', field);
    }

    // eslint-disable-next-line no-console
    console.log('Seeded department fields successfully.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding department fields:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDepartmentFields();

