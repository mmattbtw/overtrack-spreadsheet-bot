import axios from "axios";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import mongoose from "mongoose";
import { createClient } from "redis";
import config from "./config";
import constants from "./constants";
import dpsSchema from "./mongodb/models/dps-schema";
import supportSchema from "./mongodb/models/support-schema";
import tankSchema from "./mongodb/models/tank-schema";
import { overTrackData } from "./typings/typings";

const doc = new GoogleSpreadsheet(config.googleSheetID);
const refreshTime = config.devMode ? 15 : 60 * 3; // if dev mode is enabled, refresh function every 5 seconds, if it is not, refresh every 3 minutes

(async function () {
  await mongoose.connect(config.mongoDbUrl);
  console.log("Connected to MongoDB");

  const redisClient = createClient();
  console.log("Redis client created.");
  await redisClient.connect();
  console.log("Redis client connected.");

  redisClient.on("error", (err) => console.log("Redis Error", err));

  // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
  await doc.useServiceAccountAuth({
    // env var values are copied from service account credentials generated by google
    // see "Authentication" section in docs for more info
    client_email: config.googleAccountEmail,
    private_key: config.googlePrivateKey,
  });
  console.log("Authorized with Google Docs.");

  await doc.loadInfo();

  let sheet: GoogleSpreadsheetWorksheet;
  // ty is cool but balls are cooler

  if (doc.sheetCount < 1) {
    // If there are no sheets present:
    sheet = await doc.addSheet({
      // Make a new sheet with the Tank, DPS, and Support header values.
      headerValues: ["TANK", "DPS", "SUPPORT", "TIMESTAMP"],
    });
  } else if (doc.sheetCount == 1) {
    // If there is already a sheet:
    const sheets = doc.sheetsByIndex; // Grab the current sheet
    sheet = sheets[0]; // Put it in `sheet` variable.
  }

  // MAIN FUNCION \\
  /* This runs every 3 minutes
    It polls the Overtrack API, checks if the last game's ID and the local ID are the same
    If they aren't, adds the gained (or lost) SR to the spreadsheet */
  setInterval(async () => {
    console.log("Pinging Overtrack API...");
    let resp: overTrackData = await axios.get(constants.overTrackURL);
    // let resp: overTrackData = constants.mockData;

    // console.log(resp.data);

    const ifEndSrVar = resp.data.games[0].end_sr
      ? resp.data.games[0].end_sr
      : resp.data.games[0].start_sr;

    const ifEndSrBool = resp.data.games[0].end_sr ? true : false;

    let lastGameId = await redisClient.get(
      constants.redisPrefix + "lastGameID"
    );
    console.log(lastGameId);

    if (lastGameId === resp.data.games[0].key) {
      console.log("same last game.");
      return;
    }

    const formattedData = `=HYPERLINK("https://overtrack.gg/overwatch/games/${
      resp.data.games[0].key
    }", "${ifEndSrVar + " <-- Starting SR (couldn't find ending SR)"}")`;

    if (resp.data.games[0].game_type === "competitive") {
      await redisClient.set(
        constants.redisPrefix + "lastGameID",
        resp.data.games[0].key
      );

      // there HAS to be a better way to do this rather than do an if/else chain
      if (resp.data.games[0].role.toLowerCase() == "damage") {
        await sheet.addRow({
          DPS: formattedData,
          TIMESTAMP: resp.data.games[0].time,
        });

        await dpsSchema.findOneAndUpdate(
          {
            _id: resp.data.games[0].key,
          },
          {
            _id: resp.data.games[0].key,
            sr: ifEndSrVar,
            timestamp: resp.data.games[0].time,
            ifEndSr: ifEndSrBool,
          },
          {
            upsert: true,
          }
        );
      } else if (resp.data.games[0].role.toLowerCase() == "support") {
        await sheet.addRow({
          SUPPORT: formattedData,
        });

        await supportSchema.findOneAndUpdate(
          {
            _id: resp.data.games[0].key,
          },
          {
            _id: resp.data.games[0].key,
            sr: ifEndSrVar,
            timestamp: resp.data.games[0].time,
            ifEndSr: ifEndSrBool,
          },
          {
            upsert: true,
          }
        );
      } else if (resp.data.games[0].role.toLowerCase() == "tank") {
        await sheet.addRow({
          TANK: formattedData,
        });

        await tankSchema.findOneAndUpdate(
          {
            _id: resp.data.games[0].key,
          },
          {
            _id: resp.data.games[0].key,
            sr: ifEndSrVar,
            timestamp: resp.data.games[0].time,
            ifEndSr: ifEndSrBool,
          },
          {
            upsert: true,
          }
        );
      }
    }

    await sheet.saveUpdatedCells();

    // console.log(resp.data.games[0]);
    console.log("Data recieved.");
  }, 1000 * refreshTime); // Function is called every {refreshTime} seconds
})();
