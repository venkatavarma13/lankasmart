// Run this ONCE to fix stock field type in existing products
// node fix_stock.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected...');

  const result = await mongoose.connection.collection('products').updateMany(
    { stock: { $type: 'string' } },
    [{ $set: { stock: { $toInt: '$stock' } } }]
  );
  console.log(`✅ Fixed ${result.modifiedCount} products with string stock`);

  const result2 = await mongoose.connection.collection('products').updateMany(
    { mrp: { $type: 'string' } },
    [{ $set: { mrp: { $toDouble: '$mrp' } } }]
  );
  console.log(`✅ Fixed ${result2.modifiedCount} products with string mrp`);

  const result3 = await mongoose.connection.collection('products').updateMany(
    { price: { $type: 'string' } },
    [{ $set: { price: { $toDouble: '$price' } } }]
  );
  console.log(`✅ Fixed ${result3.modifiedCount} products with string price`);

  console.log('\n🎉 Done! All numeric fields are now proper numbers.');
  await mongoose.disconnect();
  process.exit(0);
}
fix().catch(e => { console.error('❌', e.message); process.exit(1); });
