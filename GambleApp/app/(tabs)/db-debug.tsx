// app/debug/db.tsx
import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { createUser, verifyLogin } from "../../src/auth";
import { setUserData, getUserData } from "../../src/userData";

type Line = { ok: boolean; msg: string };

export default function DbDebug() {
  const db = useSQLiteContext();
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);

  function push(ok: boolean, msg: string) {
    setLines(prev => [...prev, { ok, msg }]);
  }

  async function runTest() {
    setRunning(true);
    setLines([]);
    try {
      const v = await db.getFirstAsync<{ v: string }>("select sqlite_version() as v");
      push(true, `SQLite version: ${v?.v}`);

      const uv = await db.getFirstAsync<{ user_version: number }>("pragma user_version");
      push(true, `user_version: ${uv?.user_version}`);

      const tables = await db.getAllAsync<{ name: string }>(
        "select name from sqlite_master where type='table' order by name"
      );
      const tableNames = tables.map(t => t.name);
      push(tableNames.includes("users"), `tables: ${tableNames.join(", ")}`);

      // Create user
      const username = `test_${Date.now()}`;
      const password = "S3cureP@ss!";
      await createUser(db, username, password);
      push(true, `Created user: ${username}`);

      // Verify login (correct)
      const ok1 = await verifyLogin(db, username, password);
      push(ok1.ok, "Login with correct password passed");

      // Verify login (wrong)
      const ok2 = await verifyLogin(db, username, "wrongpw");
      push(!ok2.ok, "Login with wrong password rejected");

      // Write + read user_data
      await setUserData(db, (ok1 as any).userId, { theme: "dark", flags: [1, 2, 3] });
      const profile = await getUserData(db, (ok1 as any).userId);
      push(!!profile && (profile as any).theme === "dark", "user_data round-trip ok");

      push(true, "✅ All tests passed");
    } catch (e: any) {
      push(false, `❌ Test failed: ${e?.message || String(e)}`);
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
      <Pressable
        onPress={runTest}
        disabled={running}
        style={{
          padding: 12,
          backgroundColor: running ? "#ccc" : "#4ade80",
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>{running ? "Running…" : "Run DB Test"}</Text>
      </Pressable>

      <ScrollView style={{ flex: 1 }}>
        {lines.map((l, i) => (
          <Text key={i} style={{ color: l.ok ? "#16a34a" : "#dc2626", marginBottom: 6 }}>
            {l.ok ? "✔︎" : "✖︎"} {l.msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
