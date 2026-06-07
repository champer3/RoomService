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

const ICONS_BY_SLUG = {
  grocery:
    'https://res.cloudinary.com/dvxcif0nt/image/upload/v1773766555/image_12_wpqudn.png',
  household:
    'https://res.cloudinary.com/dvxcif0nt/image/upload/v1773766563/image_13_abweq7.png',
  food: 'https://res.cloudinary.com/dvxcif0nt/image/upload/v1773766504/image_11_kgunec.png',
};

async function updateDepartmentIcons() {
  try {
    await mongoose.connect(DB, { dbName: 'RoomService' });

    const slugs = Object.keys(ICONS_BY_SLUG);

    const existing = await Department.find({ slug: { $in: slugs } }).select(
      'slug name iconUrl'
    );

    // eslint-disable-next-line no-console
    console.log(
      `Found ${existing.length}/${slugs.length} departments by slug: ${slugs.join(
        ', '
      )}`
    );

    let updatedCount = 0;
    for (const slug of slugs) {
      const iconUrl = ICONS_BY_SLUG[slug];

      const res = await Department.updateOne(
        { slug },
        { $set: { iconUrl } },
        { runValidators: true }
      );

      if (res && (res.modifiedCount || res.nModified)) updatedCount += 1;
    }

    const after = await Department.find({ slug: { $in: slugs } }).select(
      'slug iconUrl'
    );

    // eslint-disable-next-line no-console
    console.log(`Updated ${updatedCount} department(s). Current values:`);
    // eslint-disable-next-line no-console
    console.table(
      after.map((d) => ({
        slug: d.slug,
        iconUrl: d.iconUrl,
      }))
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error updating department icons:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateDepartmentIcons();

