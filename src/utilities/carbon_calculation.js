/* eslint-disable import/prefer-default-export */

const WEEK_RANGE = { min: 0, max: 14 };

export async function getFoodEmissionEstimated(consumption) {
  let emission = 0;
  let waste = 0;
  let none = false;

  let data;
  try {
    data = await import('../data/food_emission.json');
  } catch (error) {
    console.error('Failed to load JSON:', error);
  }

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
