import axios from "axios";

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
  commence_time: string; // ISO
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

// 👇 NEW: types for the scores endpoint
export interface TeamScore {
  name: string;   // team name
  score: string;  // numeric string
}

export interface MatchScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: TeamScore[] | null;
  last_update?: string;
}

const apiKey = process.env.EXPO_PUBLIC_API_KEY;

export const oddsApi = axios.create({
  baseURL: "https://api.the-odds-api.com/v4",
});

// always include apiKey
oddsApi.interceptors.request.use((config) => {
  config.params = { apiKey, ...(config.params || {}) };
  const query = new URLSearchParams(config.params as Record<string, string>).toString();
  const fullUrl = `${config.baseURL}${config.url}?${query}`;
  console.log("➡️ Fetching:", fullUrl);
  return config;
});

// ✅ FIX: bookmaker keys are lowercase in the API ("draftkings","fanduel")
export const fetchMatchOdds = async (sportKey: string): Promise<MatchOdds[]> => {
  const response = await oddsApi.get<MatchOdds[]>(
    `/sports/${sportKey}/odds`,
    {
      params: {
        regions: "us",
        markets: "h2h",
        oddsFormat: "decimal",
        dateFormat: "iso",
        bookmakers: "draftkings,fanduel",
      },
    }
  );
  return response.data;
};

// 👇 NEW: fetch recent scores for a sport
export const fetchScores = async (sportKey: string): Promise<MatchScore[]> => {
  const response = await oddsApi.get<MatchScore[]>(
    `/sports/${sportKey}/scores`,
    {
      params: {
        daysFrom: 3,       // look back a few days for safety
        dateFormat: "iso",
      },
    }
  );
  return response.data;
};
