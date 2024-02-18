/* eslint-disable import/prefer-default-export */

const WEEK_RANGE = { min: 0, max: 14 };

const data = {
  foods: {
    alcohol: {
      averageWeight: 330,
      averageWeightDay: {
        alcohol: 227.5,
      },
      emissionFactors: {
        beer: 2.7,
        wine: 1.4,
      },
      wasteEmissionFactor: 'glass_bottle',
    },
    bread: {
      averageWeight: 100,
      averageWeightDay: {
        white: 116.3,
        wholemeal: 39.5,
      },
      emissionFactors: {
        wheat: 1.5,
      },
      wasteEmissionFactor: 'paper',
    },
    cheese: {
      averageWeight: 50,
      averageWeightDay: {
        cheese: 38.5,
      },
      emissionFactors: {
        cream: 3.5,
        goat: 3.6,
        hard: 5.6,
        soft: 4.3,
      },
      wasteEmissionFactor: 'fat_butter',
    },
    fish: {
      averageWeight: 130,
      averageWeightDay: {
        crustacean: 26.9,
        fish: 54,
      },
      emissionFactors: {
        canned_tuna: 4,
        crustacean: 10.7,
        salmon_farmed: 6.6,
        salmon_smoked: 5.5,
        sea_bream: 12,
        trout_steak: 6.6,
        trout_smoked: 5.5,
        whole_wild: 11.5,
      },
      wasteEmissionFactor: 'plastic_film',
    },
    harvestExotic: {
      averageWeight: 200,
      averageWeightDay: {
        fruits: 82.7,
        Legumes: 12.5,
        vegetables: 40,
      },
      emissionFactors: {
        boat: 1.3,
        flight: 27.4,
      },
      wasteEmissionFactor: 'plastic_film',
    },
    harvestLocal: {
      averageWeight: 200,
      averageWeightDay: {
        fruits: 82.7,
        legumes: 40,
        vegetables: 100,
      },
      emissionFactors: {
        in_season: 0.3,
        off_season: 2.3,
      },
      wasteEmissionFactor: 'paper',
    },
    meatRed: {
      averageWeight: 150,
      averageWeightDay: {
        delicatessen: 40.9,
        meat: 69.2,
      },
      emissionFactors: {
        beef: 35.8,
        lamb_chops: 55,
        porkBacon: 5.6,
        porcMeat: 7.4,
        porkSausage: 5.5,
        porkSausageTrad: 5.1,
        veal: 20.5,
      },
      wasteEmissionFactor: 'plastic_film',
    },
    meatWhite: {
      averageWeight: 150,
      averageWeightDay: {
        meat: 52.9,
      },
      emissionFactors: {
        chicken_breast: 4.9,
        chicken_leg: 4.9,
        chicken_whole: 5.2,
        duck_breast: 9.7,
        rabbit_whole: 8.1,
        turkey_breast: 6.5,
        turkey_leg: 6.6,
      },
      wasteEmissionFactor: 'plastic_film',
    },
    rice: {
      averageWeight: 150,
      averageWeightDay: {
        white: 90.8,
        wholemeal: 47.1,
      },
      emissionFactors: {
        cereal: 0.3,
        pasta: 0.5,
        rice: 1.4,
        semolina: 0.6,
      },
      wasteEmissionFactor: 'plastic_film',
    },
    soft: {
      averageWeight: 150,
      averageWeightDay: {
        juice: 127,
        water_bottle: 656.2,
      },
      emissionFactors: {
        juice: 1.3,
        soda: 1.1,
        water_bottle: 0.4,
      },
      wasteEmissionFactor: 'plastic_bottle',
    },
  },
  wastes: {
    cardboard: {
      packaging: 1.06,
      ratio: 0.1,
    },
    fat_butter: {
      packaging: 2,
      ratio: 0.05,
    },
    glass_bottle: {
      packaging: 1.013,
      ratio: 0.5,
    },
    food_brick: {
      packaging: 1.49,
      ratio: 0.1,
    },
    milk_bottle: {
      packaging: 1.92,
      ratio: 0.05,
    },
    none: {
      packaging: 0,
      ratio: 0,
    },
    packaging_glass: {
      packaging: 0.803,
      ratio: 0.5,
    },
    packaging_pet: {
      packaging: 3.27,
      ratio: 0.05,
    },
    paper: {
      packaging: 0.919,
      ratio: 0.1,
    },
    plastic_bottle: {
      packaging: 3.4,
      ratio: 0.05,
    },
    plastic_film: {
      packaging: 2.09,
      ratio: 0.05,
    },
    tin_can: {
      packaging: 0.319,
      ratio: 0.1,
    },
    tray: {
      packaging: 2.83,
      ratio: 0.05,
    },
    tray_ps: {
      packaging: 2.83,
      ratio: 0.05,
    },
  },
};

export async function getFoodEmissionEstimated(consumption) {
  let emission = 0;
  let waste = 0;
  let none = false;

  Object.entries(consumption).forEach(([food, value]) => {
    console.log('food: ', food, 'value: ', value);
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
