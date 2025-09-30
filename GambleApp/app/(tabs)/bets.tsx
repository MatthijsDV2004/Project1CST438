import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { getCurrentBets, getPreviousBets } from "../../lib/db";
import { useSession } from '../../lib/sessionContext';
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "expo-router";
import emitter from "@/lib/eventBus";

type Bett = {
  id: number;
  user_id: number;
 sport: string;
  team1: string;
  team2: string;
  bett_amount: number;
  is_current_bett: number;
  moneyline?: number;
  time: string;
};
export default function BetsScreen() {
const db = useSQLiteContext()

  const { user } = useSession();
  const [currentBetts, setCurrentBets] = useState<Bett[]>([]);
  const [previousBetts, setPreviousBets] = useState<Bett[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (typeof user?.id !== "number") {
      setCurrentBets([]);
      setPreviousBets([]);
      return;
    }
    const cur = await getCurrentBets(db, user.id);
    const prev = await getPreviousBets(db, user.id);
    setCurrentBets(Array.isArray(cur) ? (cur as Bett[]) : []);
    setPreviousBets(Array.isArray(prev) ? (prev as Bett[]) : []);
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  
   useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useEffect(() => {
    const handler = () => {
      load();
    };
    emitter.on("bet-placed", handler);
    return () => {
      emitter.off("bet-placed", handler);
    };
  }, [load]);

  const renderBett = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.match}>
        {item.team1} vs {item.team2}
      </Text>
      <Text>Stake: {item.bett_amount}</Text>
      <Text>Odds: {item.moneyline}</Text>
      <Text>
        Status: {item.is_current_bett ? "Open" : "Settled"}
      </Text>
      <Text style={styles.time}>
        Placed: {new Date(item.time).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.header}>🎟 Current Bets</Text>
      <FlatList
        data={currentBetts}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderBett}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text>No current bets.</Text>}
      />

      <Text style={[styles.header, { marginTop: 24 }]}>📜 Previous Bets</Text>
      <FlatList
        data={previousBetts}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderBett}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text>No previous bets.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 30, fontWeight: "700", marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  match: { fontSize: 16, fontWeight: "600" },
  time: { fontSize: 12, color: "#666" },
});
