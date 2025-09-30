import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { placeBet, NewBet, subtractCredits } from "../lib/db";
import { useSession } from "../lib/sessionContext";

export type MatchLike = {
  sport: string;
  team1: string;
  team2: string;
  moneyline?: number | null;
  time: string; // ISO
};

type Props = {
  visible: boolean;
  onClose: () => void;
  match: MatchLike;
  onPlaced?: (insertedId: number) => void;
};

export default function PlaceBetSheet({ visible, onClose, match, onPlaced }: Props) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { user } = useSession();
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const n = Number(amount);
    return !Number.isNaN(n) && n > 0;
  }, [amount]);

  const submit = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Not signed in", "Please log in first.");
      return;
    }
    if (!canSubmit) {
      Alert.alert("Invalid amount", "Enter a number greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: NewBet = {
        user_id: user.id,
        sport: match.sport,
        team1: match.team1,
        team2: match.team2,
        bett_amount: Number(amount),
        is_current_bett: 1,
        moneyline: match.moneyline ?? null,
        time: match.time,
      };
      const id = await placeBet(db, payload);
      onPlaced?.(id);
      setAmount("");
      onClose();
      await subtractCredits(db, user.id, Number(amount));
      // Navigate to the Betts tab to show the new bet (adjust route if needed)
      router.push("/bets");
    } catch (e: any) {
      Alert.alert("Could not place bet", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, canSubmit, amount, db, match, onPlaced, onClose, router]);

  return (
    <Modal visible={visible} animationType="slide" transparent testID="place-bet-modal">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Place Bet</Text>
          <Text style={styles.subtitle}>
            {match.team1} vs {match.team2}
          </Text>
          {match.moneyline != null && (
            <Text style={styles.moneyline}>Moneyline: {String(match.moneyline)}</Text>
          )}

          <Text style={styles.label}>Amount</Text>
          <TextInput
            testID="bet-amount-input"
            style={styles.input}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={submitting}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>

            <Pressable
              testID="place-bet-submit"
              style={[styles.btn, canSubmit ? styles.primary : styles.disabled]}
              onPress={submit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? <ActivityIndicator /> : <Text style={styles.btnText}>Place Bet</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { marginTop: 4, opacity: 0.8 },
  moneyline: { marginTop: 4, opacity: 0.8 },
  label: { marginTop: 16, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  cancel: { backgroundColor: "#eee" },
  primary: { backgroundColor: "#0a84ff" },
  disabled: { backgroundColor: "#b7c9ff" },
  btnText: { color: "#000", fontWeight: "600" },
});
