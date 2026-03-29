const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin'], default: 'owner' },
  phone: { type: String },
  avatarUrl: { type: String },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);