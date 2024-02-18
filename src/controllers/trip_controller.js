import axios from 'axios';
import Trip from '../models/trip_model';
import User from '../models/user_model';

// Update a trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByIdAndUpdate(id, { ...req.body, isStale: true }, { new: true });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const user = await User.findById(req.user._id);
    user.carbonFootprint_isStale = true;
    await user.save();
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
      // Send a request to Climatiq's API to get the carbon footprint for each leg
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

          // Return the carbon footprint and the origin and destination of each leg
          return { co2e: response.data.co2e, origin: response.data.origin.name, destination: response.data.destination.name };
        } catch (error) {
          if (error.response && error.response.data.error_code === 'no_route_found') {
            console.log(`No route found for mode ${mode} from ${leg} to ${legs[index + 1]}`);
            return { no_route_found: true, origin: leg, destination: legs[index + 1] };
          } else if (error.response && error.response.data.error_code === 'invalid_input') {
            return { invalid_input: true, origin: leg, destination: legs[index + 1] };
          } else {
            console.error(`Error with mode ${mode} from ${leg} to ${legs[index + 1]}: `, error);
            return null;
          }
        }
      }));

      // Check if any leg has no route
      if (modeFootprints.some((footprint) => { return footprint && (footprint.no_route_found || footprint.invalid_input); })) {
        return {
          footprint: null,
          stops: null,
        };
      }

      // Return the total carbon footprint and the list of legs if there is a carbon footprint for the route
      return {
        footprint: modeFootprints.filter((footprint) => { return footprint !== null; }).reduce((total, { co2e }) => { return total + co2e; }, 0),
        stops: [...modeFootprints.filter((footprint) => { return footprint !== null; }).map((footprint) => { return footprint.origin; }), modeFootprints[modeFootprints.length - 2].destination],
      };
    }));

    const out = {
      air: carbonFootprints[0].footprint,
      rail: carbonFootprints[1].footprint,
      car: carbonFootprints[2].footprint,
      legs: carbonFootprints[0].stops,
    };

    console.log('Carbon footprints: ', out);

    return out;
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
    const {
      air, rail, car, legs,
    } = carbonFootprints;
    trip.legs = legs;
    trip.potentialCarbonFootprint = { air, rail, car };
    trip.actualCarbonFootprint = trip.potentialCarbonFootprint[trip.modeOfTravel];
    trip.isStale = false;
    await trip.save();
    return trip;
  } catch (error) {
    return error;
  }
};

// Create a new trip
export const createTrip = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const trip = new Trip(req.body);
    await updateCarbonFootprint(trip);
    await trip.save();
    user.trips.push(trip);
    user.carbonFootprint_isStale = true;
    await user.save();
    return res.status(201).json(trip);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTrips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('trips');
    const { trips } = user;
    let updatedTrips = await Promise.all(trips.map(async (trip) => {
      if (trip.isStale) {
        return updateCarbonFootprint(trip);
      }
      return trip;
    }));
    user.trips = updatedTrips;
    await user.save();
    updatedTrips = updatedTrips.map((trip) => {
      return trip;
    });
    return res.json(updatedTrips);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTripEstimate = async (req, res) => {
  console.log('Getting trip estimate...');
  try {
    const { legs, modeOfTravel } = req.body;
    console.log('Legs: ', legs);
    const trip = new Trip({ legs, modeOfTravel });
    console.log('Trip: ', trip);
    const carbonFootprints = await getCarbonFootprints(trip);
    console.log('Carbon footprints: ', carbonFootprints);
    return res.json(carbonFootprints);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
