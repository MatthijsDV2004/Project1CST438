import {
  placeBet,
  getCurrentBets,
  getPreviousBets,
  getUserCredits,
  addCredits,
  subtractCredits,
  initDb,
  NewBet,
} from "./lib/db"; 

describe("DB functions", () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      execAsync: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("placeBet", () => {
    it("inserts a bet and returns the last insert row id", async () => {
      const bet = {
        user_id: 1,
        sport: "NBA",
        team1: "Warriors",
        team2: "Lakers",
        selected_team: "Warriors",
        bett_amount: 50,
        time: "2025-09-30T10:00:00Z",
      };

      mockDb.runAsync
        .mockResolvedValueOnce({}) 
        .mockResolvedValueOnce({ lastInsertRowId: 123 }); 

      const id = await placeBet(mockDb, bet);
      expect(id).toBe(123);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO betts"),
        expect.arrayContaining([1, "NBA", "Warriors", "Lakers", "Warriors", 50, 1, null, bet.time])
      );
    });

    it("returns 0 if insert result has no lastInsertRowId", async () => {
      const bet = {
        user_id: 2,
        sport: "NFL",
        team1: "49ers",
        team2: "Cowboys",
        selected_team: "49ers",
        bett_amount: 100,
        time: "2025-09-30T11:00:00Z",
      };

      mockDb.runAsync.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const id = await placeBet(mockDb, bet);
      expect(id).toBe(0);
    });
  });

  describe("getCurrentBets", () => {
    it("queries bets with is_current_bett = 1", async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockDb.getAllAsync.mockResolvedValue(rows);

      const result = await getCurrentBets(mockDb, 5);
      expect(result).toEqual(rows);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("is_current_bett = 1"),
        [5]
      );
    });
  });

  describe("getPreviousBets", () => {
    it("queries bets with is_current_bett = 0", async () => {
      const rows = [{ id: 3 }];
      mockDb.getAllAsync.mockResolvedValue(rows);

      const result = await getPreviousBets(mockDb, 10);
      expect(result).toEqual(rows);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("is_current_bett = 0"),
        [10]
      );
    });
  });

  describe("getUserCredits", () => {
    it("returns currency from row", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ currency: 750 });
      const credits = await getUserCredits(mockDb, 1);
      expect(credits).toBe(750);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT currency"),
        [1]
      );
    });

    it("returns 0 if no row", async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);
      const credits = await getUserCredits(mockDb, 2);
      expect(credits).toBe(0);
    });
  });

  describe("addCredits", () => {
    it("runs update with correct params", async () => {
      await addCredits(mockDb, 1, 200);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET currency = currency + ?"),
        [200, 1]
      );
    });
  });

  describe("subtractCredits", () => {
    it("runs update with MAX to avoid negatives", async () => {
      await subtractCredits(mockDb, 1, 300);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET currency = MAX(currency - ?, 0)"),
        [300, 1]
      );
    });
  });

  describe("initDb", () => {
    it("executes schema setup", async () => {
      await initDb(mockDb);
      expect(mockDb.execAsync).toHaveBeenCalled();
      expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE IF NOT EXISTS users"));
      expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE IF NOT EXISTS betts"));
    });
  });
});
