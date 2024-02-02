const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  legs: { type: [String], required: true },
  actualCarbonFootprint: { type: Number },
  modeOfTravel: { type: String, enum: ['air', 'rail', 'car'], required: true },
  potentialCarbonFootprint: {
    air: { type: Number },
    rail: { type: Number },
    car: { type: Number },
  },
  isStale: { type: Boolean, default: true },
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
