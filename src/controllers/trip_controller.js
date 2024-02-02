import axios from 'axios';
import Trip from '../models/trip_model';
import User from '../models/user_model';

// Create a new trip
export const createTrip = async (req, res) => {
  try {
    const user = User.findById(req.body.userId);
    const trip = new Trip(req.body);
    await trip.save();
    user.trips.push(trip);
    await user.save();
    return res.status(201).json(trip);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Update a trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByIdAndUpdate(id, { ...req.body, isStale: true }, { new: true });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    return res.json(trip);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Delete a trip
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    return res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Get carbon footprint for a trip for all methods of travel
export const getCarbonFootprints = async (trip) => {
  try {
    const { legs } = trip;
    const carbonFootprints = await Promise.all(['air', 'rail', 'car'].map(async (mode) => {
      const modeFootprints = await Promise.all(legs.map(async (leg, index) => {
        if (index === legs.length - 1) {
          return null;
        }
        try {
          const response = await axios.post('https://beta4.api.climatiq.io/travel/distance', {
            travel_mode: mode,
            origin: { query: leg },
            destination: { query: legs[index + 1] },
          }, {
            headers: { Authorization: `Bearer ${process.env.CLIMATIQ_API_KEY}` },
          });
          return response.data.co2e;
        } catch (error) {
          console.error(`Error with mode ${mode} from ${leg} to ${legs[index + 1]}: `, error);
          return null;
        }
      }));
      return modeFootprints.filter((footprint) => { return footprint !== null; }).reduce((a, b) => { return a + b; }, 0);
    }));

    return carbonFootprints;
  } catch (error) {
    console.error('Error calculating carbon footprints: ', error);
    throw error;
  }
};

// Update carbonFootprint and potential carbon footprints if stale
export const updateCarbonFootprint = async (trip) => {
  try {
    const carbonFootprints = await getCarbonFootprints(trip);
    console.log(`Updating carbon footprints for trip ${trip._id}: `, carbonFootprints);
    const [airFootprint, railFootprint, carFootprint] = carbonFootprints;
    trip.potentialCarbonFootprint = { air: airFootprint, rail: railFootprint, car: carFootprint };
    trip.actualCarbonFootprint = trip.potentialCarbonFootprint[trip.modeOfTravel];
    trip.isStale = false;
    await trip.save();
    return trip;
  } catch (error) {
    return error;
  }
};
export const getTrips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('trips');
    const { trips } = user;
    const updatedTrips = await Promise.all(trips.map(async (trip) => {
      if (trip.isStale) {
        return updateCarbonFootprint(trip);
      }
      return trip;
    }));
    user.trips = updatedTrips;
    await user.save();
    return res.json(updatedTrips);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
