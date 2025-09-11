import React, { useState } from "react";
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

export default function ClearUsersButton() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);

  const clearUsers = () => {
    Alert.alert(
      "Delete all users?",
      "This will remove every user from the database.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await db.execAsync(`
                DROP TABLE IF EXISTS users;

                CREATE TABLE IF NOT EXISTS users (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  first_name TEXT NOT NULL,
                  last_name  TEXT NOT NULL,
                  email TEXT NOT NULL UNIQUE,
                  password_hash TEXT NOT NULL,
                  created_at TEXT DEFAULT (datetime('now'))
                );
              `);
              Alert.alert("Done", "All users deleted.");
            } catch (e) {
              console.error("Error clearing users:", e);
              Alert.alert("Error", "Failed to delete users.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={clearUsers}
      disabled={busy}
      style={[styles.button, busy && styles.buttonDisabled]}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Clear Users</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});