/**
 * ============================================================
 *  seedAdmin.js  —  Admin Account Seeder
 * ============================================================
 *  Creates or updates a primary admin user in MongoDB.
 *  Run: node seed/seedAdmin.js (from the server folder)
 * ============================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable is missing.');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for admin seeding.');

    const adminEmail = 'milons.dev@gmail.com';
    const adminPassword = 'milon1234';
    const adminName = 'Milon Admin';

    // Check if the user already exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log(`ℹ️ Admin user with email "${adminEmail}" already exists. Updating details...`);
      adminUser.name = adminName;
      adminUser.password = adminPassword; // Pre-save hook will automatically hash this
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('✅ Admin user updated successfully.');
    } else {
      console.log(`🌱 Creating new admin user with email "${adminEmail}"...`);
      adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Pre-save hook will automatically hash this
        isAdmin: true,
      });
      await adminUser.save();
      console.log('✅ Admin user created successfully.');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
