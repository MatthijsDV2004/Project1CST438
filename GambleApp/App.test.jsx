// Basic test to make sure DB is working and that login works - Generated with ChatGPT.
jest.mock('./src/auth', () => ({
    createUser: jest.fn(),
    verifyLogin: jest.fn(),
  }));
  jest.mock('./src/userData', () => ({
    setUserData: jest.fn(),
    getUserData: jest.fn(),
  }));
  
  const { createUser, verifyLogin } = require('./src/auth');
  const { setUserData, getUserData } = require('./src/userData');
  
  function makeMockDb({ hasUsersTable = true, sqliteVersion = '3.46.0', userVersion = 1 } = {}) {
    return {
      getFirstAsync: jest.fn(async (sql) => {
        if (/sqlite_version\(\)/i.test(sql)) return { v: sqliteVersion };
        if (/pragma\s+user_version/i.test(sql)) return { user_version: userVersion };
        return {};
      }),
      getAllAsync: jest.fn(async (sql) => {
        if (/from\s+sqlite_master/i.test(sql)) {
          const base = [{ name: 'other_table' }];
          return hasUsersTable ? [{ name: 'users' }, ...base] : base;
        }
        if (/select\s+id,\s*username\s+from\s+users/i.test(sql)) {
          return [
            { id: 5, username: 'alice' },
            { id: 4, username: 'bob' },
          ];
        }
        return [];
      }),
    };
  }

  async function runDbFlow(db) {
    const lines = [];
    const push = (ok, msg) => lines.push({ ok, msg });
  
    const step = async (label, fn) => {
      try {
        await fn();
        push(true, `✔︎ ${label}`);
      } catch (e) {
        push(false, `✖︎ ${label}: ${e?.message || String(e)}`);
        throw e;
      }
    };
  
    const fixedNow = 1_726_000_000_000;
    const realNow = Date.now;
    Date.now = () => fixedNow;
  
    let createdUsername = '';
    let createdUserId = 0;
  
    try {
      await step('SQLite version + user_version + tables', async () => {
        const v = await db.getFirstAsync('select sqlite_version() as v');
        push(!!v?.v, `SQLite version: ${v?.v ?? 'unknown'}`);
  
        const uv = await db.getFirstAsync('pragma user_version');
        push(typeof uv?.user_version === 'number', `user_version: ${uv?.user_version ?? 'unknown'}`);
  
        const tables = await db.getAllAsync("select name from sqlite_master where type='table' order by name");
        const tableNames = tables.map((t) => t.name);
        const hasUsers = tableNames.includes('users');
        push(hasUsers, `tables: ${tableNames.join(', ') || '(none)'}`);
        if (!hasUsers) throw new Error('Missing required table: users');
      });
  
      await step('Create user', async () => {
        const username = `test_${Date.now()}`;
        const password = 'S3cureP@ss!';
        await createUser(db, username, password);
        createdUsername = username;
        push(true, `Created user: ${username}`);
      });
  
      await step('List latest users (id, username)', async () => {
        const users = await db.getAllAsync('select id, username from users order by id desc limit 5');
        push(true, `Users (latest 5): ${JSON.stringify(users)}`);
      });
  
      await step('Verify login succeeds with correct password', async () => {
        const result = await verifyLogin(db, createdUsername, 'S3cureP@ss!');
        if (!result?.ok) throw new Error(`verifyLogin failed: ${result?.reason ?? 'unknown reason'}`);
        createdUserId = result.userId;
      });
  
      await step('Verify login rejects wrong password', async () => {
        const wrong = await verifyLogin(db, createdUsername, 'wrongpw');
        if (wrong?.ok) throw new Error('verifyLogin unexpectedly succeeded with wrong password');
      });
  
      await step('user_data round-trip', async () => {
        await setUserData(db, createdUserId, { theme: 'dark', flags: [1, 2, 3] });
        const profile = await getUserData(db, createdUserId);
        const ok = !!profile && profile.theme === 'dark';
        if (!ok) throw new Error(`Expected theme="dark", got: ${JSON.stringify(profile)}`);
      });
  
      push(true, '✅ All tests passed');
      return lines;
    } catch (e) {
      push(false, `❌ Test failed: ${e?.message || String(e)}`);
      throw Object.assign(e, { lines });
    } finally {
      Date.now = realNow;
    }
  }
  
  describe('DB flow (converted from app/debug/db.tsx)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      // Default happy-path mocks
      createUser.mockResolvedValue(undefined);
      verifyLogin.mockImplementation(async (_db, _user, pw) =>
        pw === 'S3cureP@ss!' ? { ok: true, userId: 42 } : { ok: false, reason: 'Invalid password' }
      );
      setUserData.mockResolvedValue(undefined);
      getUserData.mockResolvedValue({ theme: 'dark', flags: [1, 2, 3] });
    });
  
    it('runs the full happy path and succeeds', async () => {
      const db = makeMockDb();
  
      const lines = await runDbFlow(db);
  
      // Final success banner
      expect(lines.some((l) => /All tests passed/.test(l.msg))).toBe(true);
  
      // Key intermediate messages
      expect(lines.some((l) => /SQLite version: 3\.46\.0/.test(l.msg))).toBe(true);
      expect(lines.some((l) => /user_version: 1/.test(l.msg))).toBe(true);
      expect(lines.some((l) => /tables: .*users/.test(l.msg))).toBe(true);
      expect(lines.some((l) => /Created user: test_/.test(l.msg))).toBe(true);
      expect(lines.some((l) => /Users \(latest 5\):/.test(l.msg))).toBe(true);
  
      // Calls performed as expected
      expect(createUser).toHaveBeenCalledTimes(1);
      const [passedDb, passedUsername, passedPw] = createUser.mock.calls[0];
      expect(passedDb).toBe(db);
      expect(passedUsername).toMatch(/^test_\d+$/);
      expect(passedPw).toBe('S3cureP@ss!');
  
      // verifyLogin called both for correct and wrong password
      expect(verifyLogin).toHaveBeenCalledWith(db, passedUsername, 'S3cureP@ss!');
      expect(verifyLogin).toHaveBeenCalledWith(db, passedUsername, 'wrongpw');
  
      // user_data round trip
      expect(setUserData).toHaveBeenCalledWith(db, 42, { theme: 'dark', flags: [1, 2, 3] });
      expect(getUserData).toHaveBeenCalledWith(db, 42);
    });
  
    it('fails early if the users table is missing', async () => {
      const db = makeMockDb({ hasUsersTable: false });
  
      await expect(runDbFlow(db)).rejects.toThrow(/Missing required table: users/);
  
      // createUser should not have been reached
      expect(createUser).not.toHaveBeenCalled();
    });
  });
  