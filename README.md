# 💋 PhobiaCide's Wormhole Guide

## 🌌 An *exhaustive* **Eve Online** *wormhole site* **reference**
  - ### ⚠️ PhobiaCide's Wormhole Guide is a **Published** *Google Sheets* **work book** that was *Modified* from **Rykki's Wormhole Guide**(*deprecated*)
    - #### 👍 It is a **must have** for wormhole life, especially for those just **beginning to explore**
    - #### 🛰 Using this guide, a capsuleer would have detailed knowledge on the dangers and rewards of each site

## Features

### 👨‍🚀 lists *all Wormhole* sites
  - 🗃️ site name and type
  - 〰️ number of waves
### 💤 *Sleepers* encountered there
  - 🛸 **number** of ships
  - 🦀 **class** of ships(*e.g. frigate, cruiser, battleship*)
  - 💥 **potential damage output**(*DPS*) of each wave
  - 🔫 which *sleeper* will *trigger* the next wave
### ⚡ Types of electronic warfare used by the *sleepers* 
  - 🍳 number of *warp scramblers*
  - 🕸️ number of *stasis webifiers* 
  - 🔋 *capacitor neutralization* in **GJ/s**
### 💰 Rewards
  - 💎**total loot value** for a given site 
  - 👾 *sleeper* **EHP/isk** value for a given site
   


### 💺 With this tool in your belt, even before undocking, you can see:

- 🔮 If your ship and fit can handle a particular site
- 💎 The ISK value of a particular ore field
- ☁️ Which gas cloud is best to huff first
- ⏱ Best possible site time under ideal conditions

## 🌠 Details

### I Redesigned Front End

#### 1. 🚀 Ship Icons

  - <details>

    <summary>🎯 Example Of Icons Used In the Guide</summary>

    ![ShipIcons](images/shipIcons.png)

  </details>

#### 2. ☄️ Aesthetic and Engaging Graphical Table

  - <details>

    <summary>🍭 A Peek At Graphical Elements Used</summary>

    ![Graphical Table](images/tableUI.png)

  </details>

### II Up-To-Date Back End

#### 1. 👽 Data for calculating sleeper engagement profile is updated every day

  - <details>

    <summary>📉 View Chart</summary>

    #### Some Key Columns From The Chart:

    |Figure|Definition|
    |------|----------|
    |Scram|Points of scram and range|
    |Web|Quantity of webs and optimal range|
    |Neut|Rate of capacitor neutralization and optimal range|
    |RRep|Rate of remote repair and optimal range|
    |Sig|The signature radius of the ship|
    |Speed|The sleeper's top speed when not at orbit range|
    |Distance|The sleeper's preferred distance at which to orbit|
    |Velocity|The speed the sleeper will burn while orbiting|

    ![Full Table](images/fullTable.png)

  </details>

#### 2. 📈 Market data for all relevant types is updated every hour

  - <details>

    <summary>🧮 Example Market Data</summary>

    ![Market Data](images/marketValues.png)

  </details>

#### 3. ⚠️ Sleeper Damage Graph

  - <details>

    <summary>📊 Check It Out</summary>

    The following graph is included in the guide and is actively calculated based on the data received from esi.evetech.net.

    ![Damage Graph](images/sleeperDamageChart.png)

  </details>

### III Acknowledgements

- <details>

    <summary>Thanks to Fuzzy Steve for maintaining a market database and for writing loadRegionAggregates()</summary>

    ```js
    /**
    * @function
    * @alias loadRegionAggregates()
    * @summary Requests aggregated market data from market.fuzzwork.co.uk for a given list of type Ids
    * @param {array} dirtyTypeIds - must be 2-dimensional
    * @param {number} [regionId = 10000002]
    * @throws Will throw an error if dirtyTypeIds is undefined
    *
    * @returns {array} Market data for the given types
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
      console.error(`loadRegionAggregates() failed with error:
        ${error.message}.`,
      );
    } finally {
      return prices;
    }
  }
  ```
</details>

## 🪐 Link To The Guide

Without further ado, <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSskkG0Lr8YTU1Qz1XrXGlIpqnHZsJePh9ipr1e2qUsmfVu8tzn0NNzAOeM7_omWbHxzWtQ5gO7V1SH/pubhtml">here</a> is a link to see the wormhole guide!

<div align="center"><h6>Made with 🔥 by PhobiaCide</h6></div>
