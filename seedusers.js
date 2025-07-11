// seedUsers.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsavy-ridesharing';

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Users to seed
  const users = [
    {
      username: 'admin',
      email: 'admin@techsavy.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '5851131111',
      isActive: true,
    },
    {
      username: 'dispatcher',
      email: 'dispatcher@techsavy.com',
      password: 'password123',
      firstName: 'Dispatcher',
      lastName: 'User',
      role: 'dispatcher',
      phone: '5851131111',
      isActive: true,
    },
  ];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`User already exists: ${existing.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});