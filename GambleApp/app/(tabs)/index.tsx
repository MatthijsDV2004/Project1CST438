// app/index.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import {Modal,
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchMatchOdds,
  fetchScores,
  MatchOdds,
  MatchScore,
} from "../../src/api/oddsApi";

import PlaceBetSheet from "../../components/PlaceBetSheet";
import { useSession } from "../../lib/sessionContext";

const SPORTS = [
  "all",
  // "soccer_epl",
  // "basketball_nba",
  "americanfootball_nfl",
  "baseball_mlb",
  // "icehockey_nhl",
  // "tennis_atp_china_open",
  // "tennis_wta_china_open"
] as const;
const PAGESIZE = 5;

export default function SportsBetExplorerPage() {
  const { user, credits } = useSession();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const C = useMemo(() => getColors(scheme), [scheme]);
  const styles = useMemo(() => createStyles(C), [C]);

  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [scoresById, setScoresById] = useState<Record<string, MatchScore>>({});
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<(typeof SPORTS)[number]>(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);

  const [selectedMatch, setSelectedMatch] = useState<MatchOdds | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // For the new PlaceBetSheet
  const [betSheetOpen, setBetSheetOpen] = useState(false);
  const [betMatch, setBetMatch] = useState<{
    sport: string;
    team1: string;
    team2: string;
    moneyline?: number | null;
    time: string;
  } | null>(null);

  // --- load matches ---
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      let items: MatchOdds[] = [];
      if (selectedSport === "all") {
        const allResults = await Promise.all(
          SPORTS.filter((s) => s !== "all").map((s) => fetchMatchOdds(s))
        );
        items = allResults.flat();
      } else {
        items = (await fetchMatchOdds(selectedSport)).slice(0, PAGESIZE);
      }
      setMatches(items);

      // also load scores
      const sportKeys = Array.from(new Set(items.map((m) => m.sport_key)));
      const allScoresArrays = await Promise.all(
        sportKeys.map((s) => fetchScores(s))
      );
      const map: Record<string, MatchScore> = {};
      allScoresArrays.flat().forEach((s) => {
        map[s.id] = s;
      });
      setScoresById(map);
    } catch (error) {
      console.error("Error fetching match odds:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, [loadMatches]);


  

  // filter
  const filteredMatches = useMemo(() => {
    let result = matches;
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      result = result.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.sport_title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [matches, deferredSearch]);

  // helpers
  const getScoreLine = useCallback(
    (m: MatchOdds) => {
      const sc = scoresById[m.id];
      const home = sc?.scores?.find((s) => s.name === m.home_team)?.score;
      const away = sc?.scores?.find((s) => s.name === m.away_team)?.score;
      if (home != null && away != null) return `${home} — ${away}`;
      return null;
    },
    [scoresById]
  );

  const sections = useMemo(() => {
    const upcoming: MatchOdds[] = [];
    const live: MatchOdds[] = [];
    filteredMatches.forEach((match) => {
      const start = Date.parse(match.commence_time);
      if (isNaN(start)) return;
      const sc = scoresById[match.id];
      if (sc?.completed) return;
      if (sc?.scores?.some((s) => !isNaN(Number(s.score)))) {
        live.push(match);
      } else {
        upcoming.push(match);
      }
    });
    return [
      { title: `🔴 Live Matches (${live.length})`, key: "live", data: live },
      { title: `📅 Upcoming Matches (${upcoming.length})`, key: "upcoming", data: upcoming },
    ];
  }, [filteredMatches, scoresById]);

  // render match
  const renderMatchCard = useCallback(
    ({ item }: { item: MatchOdds }) => {
      const scoreLine = getScoreLine(item);
      const kickoff = new Date(item.commence_time);

      return (
        <Pressable
          style={styles.matchCard}
          onPress={() => {
            setSelectedMatch(item);
            setIsDetailsOpen(true);
          }}
        >
          <Text style={styles.matchTeams}>
            {item.home_team} vs {item.away_team}
          </Text>
          {scoreLine ? (
            <Text style={styles.scoreLine}>{scoreLine}</Text>
          ) : (
            <Text style={styles.kickoffText}>
              {item.sport_title} • {kickoff.toLocaleString()}
            </Text>
          )}
        </Pressable>
      );
    },
    [getScoreLine, styles]
  );

  // header
  const ListHeader = (
    
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.header}>SportsBet Explorer</Text>
        <Pressable onPress={() => router.push("/bets")} hitSlop={8}>
          <Ionicons style={styles.icon} name="ticket-outline" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.searchBar}>{credits.toLocaleString()} Credits</Text>

        <Pressable
          onPress={() => router.push("/profile")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Ionicons style={styles.icon} name="person" size={22} color={C.text} />
        </Pressable>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search teams or leagues..."
        placeholderTextColor={C.subtext}
        value={searchTerm}
        onChangeText={setSearchTerm}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {SPORTS.map((sport) => {
          const active = selectedSport === sport;
          return (
            <Pressable
              key={sport}
              onPress={() => setSelectedSport(sport)}
              style={[styles.filterButton, active && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {sport === "all" ? "All Sports" : sport.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={C.bg}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMatchCard}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Match Details Modal */}
      <Modal visible={isDetailsOpen} animationType="slide" onRequestClose={() => setIsDetailsOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <View style={styles.modalTopBar}>
              <Pressable onPress={() => setIsDetailsOpen(false)}>
                <Ionicons name="chevron-down" size={22} color={C.text} />
              </Pressable>
              <Text style={styles.modalTitle}>
                {selectedMatch?.home_team} vs {selectedMatch?.away_team}
              </Text>
            </View>

            {selectedMatch && (
              <ScrollView style={{ padding: 16 }}>
                {selectedMatch?.bookmakers?.map((book) => (
                  <View key={book.key} style={styles.bookmakerSection}>
                    <Text style={styles.bookmakerTitle}>{book.title}</Text>
                    {book.markets?.map((market, mIdx) => (
                      <View key={`${book.key}-${market.key || mIdx}`}>
                        {market.outcomes?.map((o, idx) => (
                          <View key={`${book.key}-${market.key || mIdx}-${o.name}-${idx}`} style={styles.oddsCard}>
                            <Text>{o.name}</Text>
                            <Text>@ {o.price}</Text>
                            <Pressable
                              style={styles.oddsButton}
                              onPress={() => {
                                setBetMatch({
                                  sport: selectedMatch.sport_key,
                                  team1: selectedMatch.home_team,
                                  team2: selectedMatch.away_team,
                                  moneyline: o.price,
                                  time: selectedMatch.commence_time,
                                });
                                setBetSheetOpen(true);
                              }}
                            >
                              <Text style={styles.oddsButtonText}>Bet</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Place Bet Sheet */}
      {betMatch && (
        <PlaceBetSheet
          visible={betSheetOpen}
          onClose={() => setBetSheetOpen(false)}
          match={betMatch}
          onPlaced={() => {
            Alert.alert("Success", "Bet placed!");
            setBetSheetOpen(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// --- theme helpers ---
function getColors(scheme: "light" | "dark") {
  return {
    bg: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
    card: scheme === "dark" ? "#151515" : "#FFFFFF",
    border: scheme === "dark" ? "#262626" : "#E6E6E6",
    text: scheme === "dark" ? "#FFFFFF" : "#111111",
    subtext: scheme === "dark" ? "#A0A0A0" : "#555555",
  } as const;
}

function createStyles(C: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    listContent: { padding: 12, paddingBottom: 24 },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    header: { fontSize: 22, fontWeight: "700", color: C.text },
    icon: { marginLeft: 10 },
    searchBar: {
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginVertical: 10,
      color: C.text,
      backgroundColor: C.card,
    },
    filterRow: { paddingVertical: 6 },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 999,
      marginRight: 8,
      backgroundColor: "#f0f0f0",
    },
    filterButtonActive: { backgroundColor: C.text },
    filterText: { fontSize: 13, color: C.text },
    filterTextActive: { color: C.bg },
    sectionHeader: { paddingTop: 6, paddingBottom: 6, backgroundColor: C.bg },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
    matchCard: {
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: C.card,
    },
    matchTeams: { fontSize: 16, fontWeight: "600", color: C.text },
    scoreLine: { fontSize: 15, fontWeight: "600", color: C.text, marginTop: 6 },
    kickoffText: { fontSize: 13, color: C.subtext, marginTop: 6 },
    modalContainer: { flex: 1, backgroundColor: C.bg },
    modalTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    bookmakerSection: { marginTop: 12 },
    bookmakerTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: C.text },
    oddsCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 8,
      marginBottom: 8,
    },
    oddsButton: { backgroundColor: C.text, padding: 8, borderRadius: 6 },
    oddsButtonText: { color: C.bg, fontWeight: "700" },
  });
}
