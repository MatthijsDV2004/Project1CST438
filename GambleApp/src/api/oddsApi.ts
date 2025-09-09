import axios from "axios";
// require('dotenv').config();
//must install axios pkg on own device.

export interface Outcome {
  name: string;
  price: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

export interface MatchOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const apiKey = process.env.EXPO_PUBLIC_API_KEY;
//Must put own api key above to work properly^


  const oddsApi = axios.create({
    baseURL: "https://api.the-odds-api.com/v4",
  });
  // ensure apiKey is always present (merging params)
  oddsApi.interceptors.request.use((config) => {
    config.params = { apiKey, ...(config.params || {}) };
    const query = new URLSearchParams(config.params as Record<string, string>).toString();
  const fullUrl = `${config.baseURL}${config.url}?${query}`;

  console.log("➡️ Fetching:", fullUrl);
    return config;
  });

  export const fetchMatchOdds = async (sportKey: string): Promise<MatchOdds[]> => {
    const response = await oddsApi.get<MatchOdds[]>(
      `/sports/${sportKey}/odds`,
      {
        params: {
          regions: "us",
          markets: "h2h",
          oddsFormat: "decimal",
        },
      }
    );
    return response.data;
  };

export default oddsApi;
