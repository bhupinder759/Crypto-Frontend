import axios from "axios";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? "demo";
const BASE_URL = "https://www.alphavantage.co/query";

export const getIntradayData = async (symbol: string) => {
  const response = await axios.get(BASE_URL, {
    params: {
      function: "TIME_SERIES_INTRADAY",
      symbol,
      interval: "5min",
      apikey: API_KEY,
    },
  });
  return response.data;
};
