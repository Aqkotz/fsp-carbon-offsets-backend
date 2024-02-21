/* eslint-disable import/prefer-default-export */

const WEEK_RANGE = { min: 0, max: 14 };

const foodData = {
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

const foodSimpleData = {
  alcohol: {
    emission: 2.05,
    wasteEmissionFactor: 'glass_bottle',
    averageWeight: 330,
  },
  bread: {
    emission: 1.5,
    wasteEmissionFactor: 'paper',
    averageWeight: 100,
  },
  dairy: {
    emission: 4.25,
    wasteEmissionFactor: 'fat_butter',
    averageWeight: 50,
  },
  fish: {
    emission: 7.8,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 130,
  },
  fruit: {
    emission: 1.3,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 200,
  },
  legumes: {
    emission: 1.3,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 200,
  },
  vegetables: {
    emission: 1.3,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 200,
  },
  meatRed: {
    emission: 19.3,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 150,
  },
  meatWhite: {
    emission: 6.6,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 150,
  },
  rice: {
    emission: 0.7,
    wasteEmissionFactor: 'plastic_film',
    averageWeight: 150,
  },
  soft: {
    emission: 0.93,
    wasteEmissionFactor: 'plastic_bottle',
    averageWeight: 150,
  },
};

const houseData = {
  climateCoeffs: {
    H1: 1.1,
    H2: 0.9,
    H3: 0.6,
  },
  emissionFactors: {
    coal: {
      emissionFactor: -1,
      energyFactor: 2.687,
    },
    electric: {
      emissionFactor: 0.079,
      energyFactor: 0.079,
    },
    fuelOil: {
      emissionFactor: 0.324,
      energyFactor: 3.86,
    },
    gas: {
      emissionFactor: 0.244,
      energyFactor: 3.23,
    },
    propane: {
      emissionFactor: 0.275,
      energyFactor: 3.45,
    },
    urban: {
      emissionFactor: 0.109,
      energyFactor: -1,
    },
    wood: {
      emissionFactor: 0.0295,
      energyFactor: 0.114,
    },
  },
  consumptionFactors: {
    old: {
      apartment: {
        electric: {
          emissionFactor: 98,
          surface: 49,
          part: 16.4,
        },
        fuelOil: {
          emissionFactor: 172,
          surface: 89,
          part: 2.55,
        },
        gas: {
          emissionFactor: 146,
          surface: 71,
          part: 26.05,
        },
        propane: {
          emissionFactor: 101,
          surface: 87,
          part: 0.05,
        },
        wood: {
          emissionFactor: 211,
          surface: 79,
          part: 0.25,
        },
        urban: {
          emissionFactor: 255,
          surface: 71,
          part: 4.65,
        },
      },
      house: {
        electric: {
          emissionFactor: 150,
          surface: 96,
          part: 19.35,
        },
        fuelOil: {
          emissionFactor: 187,
          surface: 119,
          part: 9.25,
        },
        gas: {
          emissionFactor: 201,
          surface: 105,
          part: 16.1,
        },
        propane: {
          emissionFactor: 139,
          surface: 114,
          part: 1.25,
        },
        wood: {
          emissionFactor: 290,
          surface: 106,
          part: 3.9,
        },
        urban: {
          emissionFactor: -1,
          surface: -1,
          part: 0.2,
        },
      },
    },
    recent: {
      apartment: {
        electric: {
          emissionFactor: 65,
          surface: 53,
          part: 16.4,
        },
        fuelOil: {
          emissionFactor: 162,
          surface: 88,
          part: 2.55,
        },
        gas: {
          emissionFactor: 125,
          surface: 71,
          part: 26.05,
        },
        propane: {
          emissionFactor: 80,
          surface: 86,
          part: 0.05,
        },
        wood: {
          emissionFactor: 172,
          surface: 79,
          part: 0.25,
        },
        urban: {
          emissionFactor: 230,
          surface: 70,
          part: 4.65,
        },
      },
      house: {
        electric: {
          emissionFactor: 106,
          surface: 110,
          part: 19.35,
        },
        fuelOil: {
          emissionFactor: 171,
          surface: 120,
          part: 9.25,
        },
        gas: {
          emissionFactor: 166,
          surface: 112,
          part: 16.1,
        },
        propane: {
          emissionFactor: 129,
          surface: 116,
          part: 1.25,
        },
        wood: {
          emissionFactor: 235,
          surface: 114,
          part: 3.9,
        },
        urban: {
          emissionFactor: -1,
          surface: -1,
          part: 0.2,
        },
      },
    },
  },
  study: {
    apartment: 12276500,
    house: 16103200,
    peopleCount: 67626396,
  },
};

export function getFoodEmissionSimple(consumption) {
  let emission = 0;
  let waste = 0;
  let none = false;
  const data = foodData;

  Object.entries(foodData).forEach(([food, _]) => {
    const amount = consumption[food];
    if (amount < WEEK_RANGE.min || amount > WEEK_RANGE.max) { none = true; }
    if (!foodSimpleData[food]) throw new Error(`Food ${food} not found in foodSimpleData`);
    const yearlyWeight = (amount * foodSimpleData[food].averageWeight * 52) / 1000;
    emission += yearlyWeight * foodSimpleData[food].emission;
    const wasteType = foodSimpleData[food].wasteEmissionFactor;
    waste
        += yearlyWeight
        * data.wastes[wasteType].packaging
        * data.wastes[wasteType].ratio;
  });

  if (none) return { emission: -1, waste: -1 };

  return { emission, waste };
}

export function getFoodEmissionWeekly(consumption) {
  return getFoodEmissionSimple(consumption) / 52;
}

export function getFoodEmissionEstimate(consumption) {
  let emission = 0;
  let waste = 0;
  let none = false;
  const data = foodData;

  Object.entries(consumption).forEach(([category, value]) => {
    if (!value) return;
    Object.entries(value).forEach(([food, amount]) => {
      if (!amount) return;
      if (amount < WEEK_RANGE.min || amount > WEEK_RANGE.max) { none = true; }
      const yearlyWeight = (amount * data.foods[category].averageWeight * 52) / 1000;
      emission += yearlyWeight * data.foods[category].emissionFactors[food];
      const wasteType = data.foods[category].wasteEmissionFactor;
      waste
        += yearlyWeight
        * data.wastes[wasteType].packaging
        * data.wastes[wasteType].ratio;
    });
  });

  if (none) return { emission: -1, waste: -1 };

  return { emission, waste };
}

export function getHouseEmissionEstimated(house) {
  if (house.surface < 0) return -1;

  const data = houseData;

  // Get the factor emission from study - kWh/(m².year)
  const emissionFactor = data.consumptionFactors?.[house.built]?.[house.type]?.[house.heater]?.emissionFactor;
  if (!emissionFactor || emissionFactor < 0) return -1;

  // Retrieve the combustible Factor - kgCO2e/kW
  const combustibleFactor = data.emissionFactors?.[house.heater]?.emissionFactor;
  if (!combustibleFactor) return -1;

  // Check if a climateCoeff factor is available - Cste
  const climateCoeff = 1.1; // HARDCODING FOR H1 REGION: SPECIFIC TO BERLIN
  // const region = data.regions?.find((r) => { return r.DEP === house.region; });
  // if (
  //   region
  //   && data.climateCoeffs
  //   && data.climateCoeffs[region.FACTOR]
  // ) climateCoeff = data.climateCoeffs[region.FACTOR];

  // Compute
  return house.surface * emissionFactor * combustibleFactor * climateCoeff;
}
