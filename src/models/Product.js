import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  approved: { type: Boolean, default: false },
}, { timestamps: true });

// Variant: e.g. { label: '500g', value: 500, price: 45, mrp: 50 }
const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },   // Display: "500g", "1 kg", "250 ml"
  value: { type: Number, required: true },   // Numeric value
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  stock: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'piece', enum: ['piece', 'kg', 'g', 'litre', 'ml', 'metre', 'cm', 'pack'] },
  variants: [variantSchema],
  images: [{ url: String, publicId: String }],
  specifications: [{ key: String, value: String }],
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [reviewSchema],
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
