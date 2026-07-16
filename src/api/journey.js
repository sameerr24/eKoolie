import { apiRequest } from "./client";

export const lookupPnr = (pnr) => apiRequest("/journey/pnr", { method: "POST", body: { pnr } });

export const lookupTrainStatus = (trainNumber, journeyDate, destinationStation, destinationStationCode) =>
  apiRequest("/journey/train-status", {
    method: "POST",
    body: { trainNumber, journeyDate, destinationStation, destinationStationCode },
  });

export const geocodeStation = (stationName) =>
  apiRequest("/journey/geocode-station", { method: "POST", body: { stationName } });
