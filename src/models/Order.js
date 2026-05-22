import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, image: String, price: Number, quantity: Number,
  }],
  shippingAddress: { name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String },
  paymentMethod: { type: String, default: 'COD' },
  itemsPrice: Number,
  shippingPrice: { type: Number, default: 0 },
  totalAmount: Number,
  status: { type: String, enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Placed' },
  statusHistory: [{ status: String, time: { type: Date, default: Date.now }, note: String }],
  cancelReason: String,
  deliveredAt: Date,
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'LM' + Date.now().toString().slice(-8);
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
