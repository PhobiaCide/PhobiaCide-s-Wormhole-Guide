/**
 * @file code.gs
 * @author PhobiaCide
 * @date Dec 02, 2022
 * @description Keeps PhobiaCide's Rykki's Wormhole Guide up-to-date by refreshing the dogma data from esi.evetech.net and market data from fuzzwork.co.uk
 * @summary Periodically gets up-to-date data on all relative stats on the accompanying sheet
 * @license MIT
 * @copyright ©️ Andrew Amason 2022
 */

/**
 * @alias triggerUpdateDogma
 * @function
 * @description Fetches all dogma data for the listed types and notes the time
 */
function triggerUpdateDogma() {
  updateSleeperData();
  updateMissileData();
  recordDate();
}

/**
 * @alias triggerUpdatePrices
 * @function
 * @description Fetches all market data for the listed types and notes the time
 */
function triggerUpdatePrices() {
  updatePrices();
  recordDate();
}

/**
 * @alias updatePrices
 * @function
 * @description Calls loadRegionAggregates() once for each of three arrays of type id numbers gasIds, oreIds, and salIds.
 */
function updatePrices() {
  const ss = SpreadsheetApp.getActive();

  const gasIds = [
    30370, 30371, 30372, 30373, 30374, 30375, 30376, 30377, 30378,
  ];

  const oreIds = [
    18, 19, 20, 21, 22, 1223, 1224, 1225, 1226, 1227, 1228, 1229, 1230, 1231,
    1232, 11396, 17425, 17426, 17428, 17429, 17432, 17433, 17436, 17437, 17440,
    17441, 17444, 17445, 17448, 17449, 17452, 17453, 17455, 17456, 17459, 17460,
    17463, 17464, 17466, 17467, 17470, 17471, 17865, 17866, 17867, 17868, 17869,
    17870,
  ];

  const salIds = [
    30018, 30019, 30021, 30022, 30024, 30248, 30251, 30252, 30254, 30258, 30259,
    30268, 30269, 30270, 30271,
  ];

  ss.getRangeByName(`gasTab`)
    .clearContent()
    .setValues(loadRegionAggregates(gasIds));

  ss.getRangeByName(`oreTab`)
    .clearContent()
    .setValues(loadRegionAggregates(oreIds));

  ss.getRangeByName(`salTab`)
    .clearContent()
    .setValues(loadRegionAggregates(salIds));
}

/**
 * @alias updateDogma
 * @function
 * @description Fetches dogma data on a given type
 * @param {number}            typeId                        - The ID number of the type to lookup
 *
 * @returns {array} result - The result of the lookup
 */
function updateDogma(typeId) {
  const result = [];
  const typeData = lookupType(typeId);
  const dogma = typeData.dogmaattributes;
  result.push([typeId, type.name]);
  dogma.forEach(attribute => {
    result.push([attribute.attributeid, attribute.value]);
  });
  return result;
}

/**
 * @alias updateSleeperData
 * @function
 * @description Looks up sleeper dogma attributes by calling lookupTypes() with a list of sleeper type Ids and writes them to a work sheet.
 */
function updateSleeperData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`rawSleeperData`);

  const typeIds = [
    30188, 30189, 30190, 30191, 30192, 30193, 30194, 30195, 30196, 30197, 30198,
    30199, 30200, 30201, 30202, 30203, 30204, 30205, 30206, 30207, 30208, 30209,
    30210, 30211, 30212, 30213, 30214, 30215, 30216, 30217, 30460, 30461, 30462,
    37472, 37473,
  ];

  typeIds.forEach((typeId, index) => {
    const result = updateDogma(typeId);
    sheet.getRange(1, 2 * index + 1, result.length, 2).setValues(result);
  });
}

/**
 * @alias updateMissileData
 * @function
 * @description Looks up sleeper missile dogma attributes by calling lookupTypes() with a list of sleeper missile type Ids and writes them to a work sheet.
 */
function updateMissileData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`rawMissileData`);

  const typeIds = [30426, 30428, 30430];

  typeIds.forEach((typeId, index) => {
    const result = updateDogma(typeId);
    sheet.getRange(1, 2 * index + 1, result.length, 2).setValues(result);
  });
}

/**
 * @alias lookupType
 * @function
 * @description Gets information on a given type Id from https://esi.evetech.net/latest/universe/types/
 * @param {number} typeId - The ID number of the type to lookup
 */
function lookupType(typeId) {
  if (!typeId || typeId == null) {
    throw `Type Id is required`;
  } else {
    try {
      const response = cacheUrlFetchApp(
        `https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility&language=en`,
      );
      return JSON.parse(response);
    } catch (error) {
      console.error(
        `lookupType(${typeId}) failed with error ${error.message}.`,
      );
    }
  }
}

/**
 * @alias loadRegionAggregates
 * @function
 * @description Requests aggregated market data from market.fuzzwork.co.uk for a given list of type Ids
 * @param {array}               dirtyTypeIds                - A list of type ID numbers to lookup
 * @param {(number | string)}   [regionId = 10000002]       - The ID of the Region from which to pull market data
 * @throws Will throw an error if dirtyTypeIds is undefined
 *
 * @return {array} The requested market data
 */
function loadRegionAggregates(dirtyTypeIds, regionId = 10000002) {
  try {
    if (typeof dirtyTypeIds == `undefined`) {
      throw `Need a list of typeids`;
    }

    const prices = [];
    const cleanTypeIds = [];

    const url = `https://market.fuzzwork.co.uk/aggregates/?region=${regionId}&types=`;
    const options = { method: `get`, payload: `` };

    dirtyTypeIds.forEach(row => {
      row.forEach(cell => {
        if (typeof cell === "number") {
          cleanTypeIds.push(cell);
        }
      });
    });

    prices.push([
      "Buy volume",
      "Buy Weighted Average",
      "Max Buy",
      "Min Buy",
      "Buy Std Dev",
      "Median Buy",
      "Percentile Buy Price",
      "Sell volume",
      "Sell Weighted Average",
      "Max sell",
      "Min Sell",
      "Sell Std Dev",
      "Median Sell",
      "Percentile Sell Price",
    ]);

    function spliceChunks(array, chunkSize) {
      const result = [];
      while (array.length > 0) {
        const chunk = array.splice(0, chunkSize);
        result.push(chunk);
      }
      return result;
    }

    const chunkSize = 100;
    const chunkedArray = spliceChunks(cleanTypeIds, chunkSize);
    chunkedArray.forEach(chunk => {
      Utilities.sleep(Math.random() * 200);
      const urlTypes = chunk.join(",").replace(/,$/, "");
      const json = JSON.parse(
        UrlFetchApp.fetch(url + urlTypes, options).getContentText(),
      );
      if (json) {
        chunk.forEach(entry => {
          const price = [
            parseInt(json[entry].buy.volume),
            parseInt(json[entry].buy.weightedAverage),
            parseFloat(json[entry].buy.max),
            parseFloat(json[entry].buy.min),
            parseFloat(json[entry].buy.stddev),
            parseFloat(json[entry].buy.median),
            parseFloat(json[entry].buy.percentile),
            parseInt(json[entry].sell.volume),
            parseFloat(json[entry].sell.weightedAverage),
            parseFloat(json[entry].sell.max),
            parseFloat(json[entry].sell.min),
            parseFloat(json[entry].sell.stddev),
            parseFloat(json[entry].sell.median),
            parseFloat(json[entry].sell.percentile),
          ];
          prices.push(price);
        });
      }
    });
  } catch (error) {
    // TODO (developer) Handle Exception
    console.error(
      `loadRegionAggregates() failed with error: ${error.message}.`,
    );
  } finally {
    return prices;
  }
}

/**
 * @alias recordDate
 * @function
 * @description Records current date to predefined cells in the worksheet
 */
function recordDate() {
  const pages = [
    "C1Date",
    "C2Date",
    "C3Date",
    "C4Date",
    "C5Date",
    "C6Date",
    "gasDate",
    "oreDate",
  ];
  pages.forEach(page => {
    SpreadsheetApp.getActiveSpreadsheet().getRangeByName(page).setValue(timeStamp());
  });
}

/**
 * @alias timeStamp
 * @function
 * @description Determines the current UTC date and time and assembles a time stamp
 *
 * @returns {string} The time stamp representing the current UTC date and time  
 */
function timeStamp() {
  const today = new Date();

  const year = today
    .getUTCFullYear()
    .toLocaleString("en-US", { minimumIntegerDigits: 4, useGrouping: false });
  const month = (today.getUTCMonth() + 1).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const day = today
    .getUTCDate()
    .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false });

  const date = `${year}-${month}-${day}`;

  const hour = today
    .getUTCHours()
    .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false });
  const minute = today
    .getUTCMinutes()
    .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false });
  const second = today
    .getUTCSeconds()
    .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false });
  const millisecond = today
    .getUTCMilliseconds()
    .toLocaleString("en-US", { minimumIntegerDigits: 3, useGrouping: false });

  const time = `${hour}:${minute}:${second}:${millisecond}`;

  return `${date}T${time}Z`;
}