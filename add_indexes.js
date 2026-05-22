// Run ONCE: node add_indexes.js
// Adds database indexes for faster product/order queries
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function addIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');
  const db = mongoose.connection;

  // Products indexes
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('products').createIndex({ isActive: 1 });
  await db.collection('products').createIndex({ featured: 1 });
  await db.collection('products').createIndex({ trending: 1 });
  await db.collection('products').createIndex({ name: 'text', brand: 'text', description: 'text' });
  await db.collection('products').createIndex({ price: 1 });
  await db.collection('products').createIndex({ category: 1, isActive: 1, price: 1 });
  console.log('✅ Product indexes created');

  // Orders indexes
  await db.collection('orders').createIndex({ user: 1 });
  await db.collection('orders').createIndex({ status: 1 });
  await db.collection('orders').createIndex({ createdAt: -1 });
  console.log('✅ Order indexes created');

  // Users indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ phone: 1 });
  console.log('✅ User indexes created');

  console.log('\n🚀 All indexes created! Queries will be much faster now.');
  await mongoose.disconnect();
  process.exit(0);
}
addIndexes().catch(e => { console.error('❌', e.message); process.exit(1); });
