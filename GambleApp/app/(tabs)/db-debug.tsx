// app/debug/db.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { createUser, verifyLogin } from "../../src/auth";
import { setUserData, getUserData } from "../../src/userData";

type Line = { ok: boolean; msg: string };

// If you control these, make sure verifyLogin returns this shape.
type VerifyLoginResult =
  | { ok: true; userId: number }
  | { ok: false; reason?: string };

export default function DbDebug() {
  const db = useSQLiteContext();
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function push(ok: boolean, msg: string) {
    setLines(prev => [...prev, { ok, msg }]);
  }

  function clear() {
    setLines([]);
  }

  useEffect(() => {
    // auto-scroll to bottom as new lines come in
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [lines.length]);

  async function runTest() {
    if (running) return;
    setRunning(true);
    setLines([]);

    const step = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
        push(true, `✔︎ ${label}`);
      } catch (e: any) {
        push(false, `✖︎ ${label}: ${e?.message || String(e)}`);
        throw e; // stop test on first failure
      }
    };

    try {
      await step("SQLite version + user_version + tables", async () => {
        const v = await db.getFirstAsync<{ v?: string }>("select sqlite_version() as v");
        push(!!v?.v, `SQLite version: ${v?.v ?? "unknown"}`);

        const uv = await db.getFirstAsync<{ user_version?: number }>("pragma user_version");
        push(typeof uv?.user_version === "number", `user_version: ${uv?.user_version ?? "unknown"}`);

        const tables = await db.getAllAsync<{ name: string }>(
          "select name from sqlite_master where type='table' order by name"
        );
        const tableNames = tables.map(t => t.name);
        const hasUsers = tableNames.includes("users");
        push(hasUsers, `tables: ${tableNames.join(", ") || "(none)"}`);
        if (!hasUsers) throw new Error("Missing required table: users");
      });

      // Create user
      let createdUsername = "";
      let createdUserId = 0;

      await step("Create user", async () => {
        const username = `test_${Date.now()}`;
        const password = "S3cureP@ss!";
        await createUser(db, username, password);
        createdUsername = username;
        push(true, `Created user: ${username}`);
      });

      await step("List latest users (id, username)", async () => {
        const users = await db.getAllAsync<{ id: number; username: string }>(
          "select id, username from users order by id desc limit 5"
        );
        console.log("Users in DB after insert:", users);

        push(true, `Users (latest 5): ${JSON.stringify(users)}`);
      });

      await step("Verify login succeeds with correct password", async () => {
        const result = (await verifyLogin(db, createdUsername, "S3cureP@ss!")) as VerifyLoginResult;
        if (!result.ok) throw new Error(`verifyLogin failed: ${result.reason ?? "unknown reason"}`);
        createdUserId = result.userId;
      });

      await step("Verify login rejects wrong password", async () => {
        const wrong = (await verifyLogin(db, createdUsername, "wrongpw")) as VerifyLoginResult;
        if (wrong.ok) throw new Error("verifyLogin unexpectedly succeeded with wrong password");
      });

      await step("user_data round-trip", async () => {
        await setUserData(db, createdUserId, { theme: "dark", flags: [1, 2, 3] });
        const profile = await getUserData(db, createdUserId);
        const ok = !!profile && (profile as any).theme === "dark";
        if (!ok) throw new Error(`Expected theme="dark", got: ${JSON.stringify(profile)}`);
      });

      push(true, "✅ All tests passed");
    } catch (e: any) {
      // error already pushed in step()
      // also push a final "failed" line for visibility
      push(false, `❌ Test failed: ${e?.message || String(e)}`);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    // Optional: auto-run once when page opens
    // runTest();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={runTest}
          disabled={running}
          style={{
            padding: 12,
            backgroundColor: running ? "#ccc" : "#4ade80",
            borderRadius: 10,
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{running ? "Running…" : "Run DB Test"}</Text>
        </Pressable>

        <Pressable
          onPress={clear}
          disabled={running || lines.length === 0}
          style={{
            padding: 12,
            backgroundColor: running || lines.length === 0 ? "#eee" : "#fca5a5",
            borderRadius: 10,
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        {lines.map((l, i) => (
          <Text key={i} style={{ color: l.ok ? "#16a34a" : "#dc2626", marginBottom: 6 }}>
            {l.msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
