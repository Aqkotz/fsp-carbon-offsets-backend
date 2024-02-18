/* eslint-disable import/prefer-default-export */
import data from './food_emission.json';

const WEEK_RANGE = { min: 0, max: 14 };

export function getFoodEmissionEstimated(consumption) {
  let emission = 0;
  let waste = 0;
  let none = false;
  Object.entries(consumption).forEach(([food, value]) => {
    if (!value) return;
    if (value < WEEK_RANGE.min || value > WEEK_RANGE.max) { none = true; }
    const yearlyWeight = (value * data.foods[food].averageWeight * 52) / 1000; // (from g to Kg)
    emission += yearlyWeight * data.foods[food].emissionFactor;
    waste
        += yearlyWeight
        * data.foods[food].wasteRatioFactor
        * data.foods[food].wasteEmissionFactor;
  });

  if (none) return { emission: -1, waste: -1 };

  return { emission, waste };
}
