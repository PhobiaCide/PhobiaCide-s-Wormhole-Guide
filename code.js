/**
 * @file code.gs
 * @author PhobiaCide
 * @date Dec 02, 2022
 * @description Keeps PhobiaCide's Rykki's Wormhole Guide up-to-date by refreshing the dogma data from esi.evetech.net and market data from fuzzwork.co.uk
 * @summary Periodically gets up-to-date data on all relative stats on the accompanying sheet
 * @copyright ©️ Andrew Amason 2022
 */

/**
 * @function triggerUpdateDogma()
 * @description Fetches all dogma data for the listed types and notes the time
 *
 * @return {null}
 */
function triggerUpdateDogma() {
  updateSleeperData();
  updateMissileData();
  recordDate();
}

/**
 * @function triggerUpdatePrices()
 * @description Fetches all market data for the listed types and notes the time
 *
 * @return {null}
 */
function triggerUpdatePrices() {
  updatePrices();
  recordDate();
}

/**
 * @name updatePrices
 * @description Calls loadRegionAggregates() once for each of three arrays of type id numbers gasIds, oreIds, and salIds.
 *
 * @return {null}
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
 * @function lookupDogma()
 * @description Fetches dogma data on a given type
 * @param {number} typeId - The ID number of the type to lookup
 *
 * @returns {array} result - The result of the lookup
 */
function lookupDogma(typeId) {
  const result = [];
  const typeData = lookupType(typeId);
  const dogma = typeData.dogmaattributes;
  result.push([typeId, type.name]);
  dogma.forEach(
    attribute => {
      result.push([attribute.attributeid, attribute.value]);
    }
  );
  return result;
}

/**
 * @function updateSleeperData()
 * @description Looks up sleeper dogma attributes by calling lookupTypes() with a list of sleeper type Ids and writes them to a work sheet.
 *
 * @return {null}
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
    const result = lookupDogma(typeId);
    sheet.getRange(1, 2 * index + 1, result.length, 2).setValues(result);
  });
}

/**
 * @name updateMissileData()
 * @description Looks up sleeper missile dogma attributes by calling lookupTypes() with a list of sleeper missile type Ids and writes them to a work sheet.
 *
 * @return {null}
 */
function updateMissileData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`rawMissileData`);

  const typeIds = [30426, 30428, 30430];

  typeIds.forEach((typeId, index) => {
    const result = lookupDogma(typeId);
    sheet.getRange(1, 2 * index + 1, result.length, 2).setValues(result);
  });
}

/**
 * @function lookupType()
 * @description Gets information on a given type Id from https://esi.evetech.net/latest/universe/types/
 * @param {number} typeId - The ID number of the type to lookup
 *
 *  @return {null}
 */
function lookupType(typeId) {
  if (!typeId || typeId == null) {
    throw `Type Id is required`;
  } else {
    try {
      const response = cacheUrlFetchApp(
        `https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility&language=en`
      );
      return JSON.parse(response);
    } catch (error) {
      console.error(
        `lookupType(${typeId}) failed with error ${error.message}.`
      );
    }
  }
}

/**
 * @function loadRegionAggregates()
 * @description Requests aggregated market data from market.fuzzwork.co.uk for a given list of type Ids
 * @param {array} typeIds
 * @param {number} regionId(Optional)
 * 
 * @return {array}
 */
function loadRegionAggregates(typeIds, regionId = 10000002) {
  if (typeof typeIds == `undefined`) {
    throw `Need a list of typeIds`;
  }
  const cleantypeIds = typeIdCleaner(typeIds);
  const requestUrl = `https://market.fuzzwork.co.uk/aggregates/?region=${regionId}&types=`;
  const prices = [];
  // set the headers
  prices.push([
    `typeId`,
    `Buy Volume`,
    `Buy Weighted Average`,
    `Max Buy`,
    `Min Buy`,
    `Buy Std Dev`,
    `Median Buy`,
    `Percentile Buy Price`,
    `Sell Volume`,
    `Sell Weighted Average`,
    `Max sell`,
    `Min Sell`,
    `Sell Std Dev`,
    `Median Sell`,
    `Percentile Sell Price`,
  ]);
  let chunkArray = [];
  const chunk = 100;

  for (let o = 0, j = cleantypeIds.length; o < j; o += chunk) {
    chunkArray = cleantypeIds.slice(o, o + chunk);
    Utilities.sleep(100);
    const fetchTypes = chunkArray.join(`,`).replace(/,$/, ``);
    const fetchResponse = cacheUrlFetchApp(requestUrl + fetchTypes);
    const json = JSON.parse(fetchResponse);
    if (json) {
      chunkArray.forEach((typeId) => {
        typeData = json[typeId];
        prices.push([
          parseInt(typeId),
          parseInt(typeData.buy.volume),
          parseInt(typeData.buy.weightedAverage),
          parseFloat(typeData.buy.max),
          parseFloat(typeData.buy.min),
          parseFloat(typeData.buy.stddev),
          parseFloat(typeData.buy.median),
          parseFloat(typeData.buy.percentile),
          parseInt(typeData.sell.volume),
          parseFloat(typeData.sell.weightedAverage),
          parseFloat(typeData.sell.max),
          parseFloat(typeData.sell.min),
          parseFloat(typeData.sell.stddev),
          parseFloat(typeData.sell.median),
          parseFloat(typeData.sell.percentile),
        ]);
      });
    }
  }

  return prices;
}

function test() {
  console.log(timeStamp());
}

/**
 * Records current date to predefined cell in a worksheet
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
  pages.forEach((page) => {
    SpreadsheetApp.getActiveSpreadsheet().getRangeByName(page).setValue(now());
  });
}

function test() {
  recordDate();
}

function now() {
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

  const time = `${hour}:${minute}:${second}`;

  return `${date} ${time}`;
}

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
