const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

if (!process.env.MONGODB_URI) { console.error('❌ MONGODB_URI missing'); process.exit(1); }

const userSchema = new mongoose.Schema({
  name: String, email: { type: String, lowercase: true },
  password: String, phone: String,
  role: { type: String, default: 'user' },
  addresses: Array, isActive: { type: Boolean, default: true },
}, { timestamps: true });

// NO pre-save hook in seed - we hash manually
const User = mongoose.model('User', userSchema);

async function seed() {
  console.log('\n🛒 L MART - Admin Account Setup');
  console.log('=================================');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const hash = await bcrypt.hash('LMART2026', 12);
  console.log('✅ Password hashed');

  // Use Model.findOneAndUpdate - no pre-save hook fires
  await User.findOneAndUpdate(
    { email: 'supportlmart@gmail.com' },
    { $set: { name: 'L MART Admin', email: 'supportlmart@gmail.com', password: hash, role: 'admin', phone: '9398321557', isActive: true } },
    { upsert: true }
  );

  console.log('\n✅ Admin account ready!');
  console.log('   📧 Email    : supportlmart@gmail.com');
  console.log('   🔑 Password : LMART2026');
  console.log('   👤 Role     : admin');
  console.log('\n→ Login: http://localhost:3000/login\n');

  await mongoose.disconnect();
  process.exit(0);
}
seed().catch(e => { console.error('❌', e.message); process.exit(1); });
