const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  legs: { type: [String], required: true },
  actualCarbonFootprint: { type: Number, required: true },
  modeOfTravel: { type: String, enum: ['air', 'rail', 'car'], required: true },
  potentialCarbonFootprint: {
    air: { type: Number, required: true },
    rail: { type: Number, required: true },
    car: { type: Number, required: true },
  },
  isStale: { type: Boolean, default: true },
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
