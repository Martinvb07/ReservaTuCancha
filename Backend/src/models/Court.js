const mongoose = require('mongoose');

const geoLocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  coordinates: { type: [Number], index: '2dsphere' },
  city: String,
  department: String
}, { _id: false });

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, default: 60 }
}, { _id: false });

const courtSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  sport: { type: String, enum: ['futbol', 'padel', 'voley_playa'], required: true },
  location: { type: geoLocationSchema, required: true },
  pricePerHour: { type: Number, required: true, min: 0 },
  // ...otros campos según tu esquema original
}, { timestamps: true });

module.exports = mongoose.model('Court', courtSchema);