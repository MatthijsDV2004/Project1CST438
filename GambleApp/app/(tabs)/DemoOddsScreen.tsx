import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter, Link } from 'expo-router';
import { fetchMatchOdds, MatchOdds } from "../../src/api/oddsApi";
import{ Ionicons } from '@expo/vector-icons';

const SPORTS = ["all", "soccer_epl", "basketball_nba", "americanfootball_nfl"];
const PAGESIZE = 10;

export default function SportsBetExplorerPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchOdds | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // fetch matches based on selected sport
  const loadMatches = async () => {
    setLoading(true);
    try {
      if (selectedSport === "all") {
        const allResults = await Promise.all(
          SPORTS.filter((s) => s !== "all").map((s) => fetchMatchOdds(s))
        );
        setMatches(allResults.flat());
      } else {
        const sportMatches = await fetchMatchOdds(selectedSport);
        setMatches(sportMatches.slice(0, PAGESIZE));
      }
    } catch (error) {
      console.error(
        "Error fetching match odds:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [selectedSport]);

  // filtering logic
  const filteredMatches = useMemo(() => {
    let result = matches;

    if (searchTerm) {
      result = result.filter(
        (m) =>
          m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.sport_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [matches, searchTerm]);

  // categorize matches
  const now = Date.now();
  const LIVE_MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

  const { liveMatches, upcomingMatches } = useMemo(() => {
    const live: MatchOdds[] = [];
    const upcoming: MatchOdds[] = [];
    console.log("Filtered Matches Count:", filteredMatches.length);
    console.log("Filtered Matches:", filteredMatches);

    filteredMatches.forEach((match) => {
      if (
        typeof match.commence_time === "string" &&
        !isNaN(Date.parse(match.commence_time))
      ) {
        const matchStart = new Date(match.commence_time).getTime();
        const matchEnd = matchStart + LIVE_MATCH_DURATION_MS;
        if (now >= matchStart && now <= matchEnd) {
          live.push(match);
        } else if (matchStart > now) {
          upcoming.push(match);
        }
      }
    });
    return { liveMatches: live, upcomingMatches: upcoming };
  }, [filteredMatches]);

  // card renderer
  const renderMatchCard = ({ item }: { item: MatchOdds }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => {
        setSelectedMatch(item);
        setIsDetailsOpen(true);
      }}
    >
      <Text style={styles.matchTeams}>
        {item.home_team} vs {item.away_team}
      </Text>
      <Text style={styles.league}>{item.sport_title}</Text>
    </TouchableOpacity>
  );

  // Handler for Bet button
const [confirmVisible, setConfirmVisible] = useState(false);
const [confirmData, setConfirmData] = useState<{ team: string; price: number } | null>(null);

const handleConfirmBet = () => {
  let amount: number | null = null;
  if (confirmData) {
    // TODO: replace with  real bet logic
    amount = Number(stake);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid stake amount.");
      return;
    }
    alert(`Bet placed on ${confirmData.team} at the odds of ${confirmData.price} for ${amount}`);
  }
  setConfirmVisible(false);
  setConfirmData(null);
};
const[stake, setStake] = useState<string>("");

// --- Wallet state ---
const [wallet, setWallet] = useState<{ currency: string; amount: number } | null>(null);
const [walletLoading, setWalletLoading] = useState(false);
const [walletError, setWalletError] = useState<string | null>(null);

// Format helper
const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

// TODO: replace this with DB call
async function fetchUserWallet(userId: string) {
  // Example placeholder. Swap for real database call
  await new Promise(r => setTimeout(r, 400)); // small delay to show loading
  return { currency: "USD", amount: 500.00 };
}

async function loadWallet() {
  try {
    setWalletLoading(true);
    setWalletError(null);
    const data = await fetchUserWallet("demo-user-123"); // TODO: use real user id
    setWallet(data);
  } catch (e: any) {
    setWalletError(e?.message ?? "Could not load balance.");
  } finally {
    setWalletLoading(false);
  }
}


  
    return (
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>SportsBet Explorer
          <TouchableOpacity onPress={() => router.push("/Profile")}>
            <Ionicons style={styles.icon} name="person" size={20} color="black" />
          </TouchableOpacity>
        </Text>

      {/* Search */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search teams or leagues..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* Sport Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.filterButton,
              selectedSport === sport && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSport === sport && styles.filterTextActive,
              ]}
            >
              {sport === "all" ? "All Sports" : sport.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <ScrollView>
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🔴 Live Matches ({liveMatches.length})
              </Text>
              <FlatList
                data={liveMatches}
                renderItem={renderMatchCard}
                keyExtractor={(item, idx) => item.id ?? idx.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Upcoming Matches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📅 Upcoming Matches ({upcomingMatches.length})
            </Text>
            {upcomingMatches.length === 0 ? (
              <Text style={styles.noMatches}>No matches found.</Text>
            ) : (
              <FlatList
                data={upcomingMatches}
                renderItem={renderMatchCard}
                keyExtractor={(item, idx) => item.id ?? idx.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* Match Details Modal */}
<Modal visible={isDetailsOpen} animationType="slide">
  <View style={styles.modalContainer}>
    <Button title="Close" onPress={() => setIsDetailsOpen(false)} />
    <View style={styles.walletBar}>
      <View style={styles.walletLeft}>
        <Ionicons name="wallet" size={18} color="#111" />
        {walletLoading ? (
          <Text style={styles.walletText}>Loading balance...</Text>
        ) : walletError ? (
          <Text style={[styles.walletText, { color: "#b00" }]}>
            {walletError}
          </Text>
        ) : (
          <Text style={styles.walletText}>
            Balance: {wallet ? formatCurrency(wallet.amount, wallet.currency) : "--"}
          </Text>
        )}
      </View>
    </View>
    {selectedMatch && (
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {selectedMatch.bookmakers?.map((book) => (
          <View key={book.key} style={styles.bookmakerSection}>
            <Text style={styles.bookmakerTitle}>{book.title}</Text>

            {book.markets?.map((market, mIdx) => (
              <View key={`${book.key}-${market.key || mIdx}`}>
                {market.outcomes?.map((o, idx) => (
                  <View
                    key={`${book.key}-${market.key || mIdx}-${o.name}-${idx}`}
                    style={styles.oddsCard}
                  >
                    <View style={styles.oddsInfo}>
                      <Text style={styles.oddsTeam}>
                        {o.name?.toLowerCase() === "draw"
                          ? "Draw"
                          : o.name}
                      </Text>
                      <Text style={styles.oddsPrice}>{o.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.oddsButton}
                      onPress={() => {
                        setConfirmData({ team: o.name, price: o.price });
                        setStake("");
                        setConfirmVisible(true);
                      }}
                    >
                      <Text style={styles.oddsButtonText}>Bet</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    )}
  </View>
</Modal>
      {/* Confirm Bet Modal */}{/* Confirm Popup */}
<Modal
  visible={confirmVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setConfirmVisible(false)}
>
 
  <View style={styles.popupOverlay}>
    <View style={styles.popupCard}>
      <Text style={styles.popupTitle}>Confirm Bet</Text>
      <Text style={styles.popupText}>
        Place bet on <Text style={styles.popupStrong}>{confirmData?.team}</Text> at the odds of ${" "}
        <Text style={styles.popupStrong}>{confirmData?.price}</Text>?
      </Text>
       <TextInput
          value={stake}
          onChangeText={setStake}
          placeholder="Enter your bet"
          keyboardType="decimal-pad"
          style={styles.popupInput}
        />
      <View style={styles.popupActions}>
        <TouchableOpacity
          style={[styles.popupBtn, styles.popupCancel]}
          onPress={() => setConfirmVisible(false)}
        >
          <Text style={styles.popupBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.popupBtn, styles.popupConfirm]}
          onPress={handleConfirmBet}
        >
          <Text style={[styles.popupBtnText, styles.popupConfirmText]}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
icon: { 
  marginLeft: 160,
  marginTop: 30,
  width: 30,
  height: 30,
  borderRadius:25,
  backgroundColor: '#e0e0e0',
  borderWidth:5,
  justifyContent:'center',
  alignItems:'center',
},
searchBar: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 8,
  marginBottom: 12,
},
filterRow: { flexDirection: "row", marginBottom: 4 }, // reduced marginBottom
filterButton: {
  paddingTop: 4,        // smaller top padding
  paddingBottom: 4,     // smaller bottom padding
  paddingHorizontal: 10, // keep horizontal spacing nice
  borderRadius: 12,     // slightly smaller rounded corners
  borderWidth: 1,
  borderColor: '#ccc',
  marginRight: 6, 

  
},
filterButtonActive: {
  backgroundColor: "#007AFF",
  borderColor: "#007AFF",
  marginBottom:4,
  width: 110,
  height: 30,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 3,
},
filterText: { color: "#333" },
filterTextActive: { color: "#fff" },
section: { marginBottom: 20 },
sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, marginTop:8 },
matchCard: {
  padding: 12,
  backgroundColor: "#fff",
  marginBottom: 5,
  borderRadius: 5,
  elevation: 1,
},
matchTeams: { fontSize: 16, fontWeight: "bold" },
league: { fontSize: 14, color: "#666" },
noMatches: { textAlign: "center", color: "#666", marginTop: 8 },
modalContainer: { flex: 1, padding: 16 },
modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
bookmakerSection: { marginVertical: 8 },
bookmakerTitle: { fontWeight: "600", marginTop: 6 },
oddsCard: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 12,
  backgroundColor: "#fff",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#eee",
  marginTop: 8,
  // light shadow
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 1,
},
oddsInfo: {
  flexDirection: "row",
  alignItems: "baseline",
  gap: 8,
},
oddsTeam: {
  fontSize: 16,
  fontWeight: "600",
},
oddsPrice: {
  fontSize: 16,
  fontWeight: "700",
  color: "#0a7",
},
oddsButton: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: "#0a7",
  borderRadius: 999,
},
oddsButtonText: {
  color: "#fff",
  fontWeight: "700",
},


popupOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,
},
popupCard: {
  width: "100%",
  maxWidth: 360,
  backgroundColor: "#fff",
  borderRadius: 14,
  padding: 16,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 10,
  elevation: 5,
},
popupTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 6,
},
popupText: {
  fontSize: 16,
  color: "#333",
  marginBottom: 16,
},
popupStrong: {
  fontWeight: "700",
  color: "#000",
},
popupActions: {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 8,
},
popupBtn: {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 10,
  backgroundColor: "#eee",
},
popupCancel: {
  backgroundColor: "#eee",
},
popupConfirm: {
  backgroundColor: "#0a7",
},
popupBtnText: {
  fontWeight: "700",
  color: "#333",
},
popupConfirmText: {
  color: "#fff",
},
popupInput: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  marginBottom: 10,
},
popupHint: {
  fontSize: 14,
  color: "#555",
  marginBottom: 12,
},
walletBar: {
  marginTop: 12,
  marginBottom: 8,
  padding: 10,
  backgroundColor: "#f1f5f9",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
walletLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
walletText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#111",
},
walletRefresh: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: "#e6f0ff",
  borderWidth: 1,
  borderColor: "#cfe1ff",
},
walletRefreshText: {
  color: "#007AFF",
  fontWeight: "700",
  fontSize: 13,
},

});
