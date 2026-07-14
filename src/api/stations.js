import { apiRequest } from "./client";

export const getStations = () => apiRequest("/stations");
