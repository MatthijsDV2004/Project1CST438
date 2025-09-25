// More mobile-friendly, accessible, and performant version
// - Uses SafeAreaView + StatusBar
// - Pull-to-refresh
// - Single SectionList with sticky headers (proper virtualization on mobile)
// - Larger touch targets + hitSlop
// - Dark mode aware via useColorScheme
// - KeyboardAvoidingView for modals
// - Debounced search with useDeferredValue

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  RefreshControl,
  ScrollView,
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

const SPORTS = [
  "all",
  "soccer_epl",
  "basketball_nba",
  "americanfootball_nfl",
  "baseball_mlb",
] as const;
const PAGESIZE = 100;

export default function SportsBetExplorerPage() {
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

  // keep a ticking "now" so live classification updates in-place
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // --- Wallet state ---
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    team: string;
    price: number;
  } | null>(null);
  const [stake, setStake] = useState<string>("");

  const [wallet, setWallet] = useState<{ currency: string; amount: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const formatCurrency = (amount?: number, currency = "USD") =>
    amount != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
      : "--";

  async function fetchUserWallet(userId: string) {
    await new Promise((r) => setTimeout(r, 400));
    return { currency: "USD", amount: 500.0 };
  }
  async function loadWallet() {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const data = await fetchUserWallet("demo-user-123");
      setWallet(data);
    } catch (e: any) {
      setWalletError(e?.message ?? "Could not load balance.");
    } finally {
      setWalletLoading(false);
    }
  }
  // load wallet when opening details
  useEffect(() => {
    if (isDetailsOpen) loadWallet();
  }, [isDetailsOpen]);

  // fetch matches based on selected sport
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

  // poll scores every 30s while this screen is mounted
  useEffect(() => {
    if (!matches.length) return;
    const sportKeys = Array.from(new Set(matches.map((m) => m.sport_key)));
    const id = setInterval(async () => {
      try {
        const arrays = await Promise.all(sportKeys.map((s) => fetchScores(s)));
        const map: Record<string, MatchScore> = {};
        arrays.flat().forEach((s) => {
          map[s.id] = s;
        });
        setScoresById(map);
      } catch (e) {
        console.warn("Score poll failed:", e);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [matches]);

  // --- filtering ---
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

  // --- helpers ---
  const LIVE_FALLBACK_MS = 3 * 60 * 60 * 1000;
  const isMatchLive = useCallback(
    (m: MatchOdds): boolean => {
      const score = scoresById[m.id];
      const start = Date.parse(m.commence_time);
      const started = now >= start;
      const hasNumbers =
        Array.isArray(score?.scores) && score.scores.some((s) => !isNaN(Number(s.score)));
      const notFinished = score ? !score.completed : true;
      return (
        (started && hasNumbers && notFinished) ||
        (started && now <= start + LIVE_FALLBACK_MS && notFinished)
      );
    },
    [scoresById, now]
  );

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

  // --- categorize into sections (virtualized) ---
  const sections = useMemo(() => {
    const live: MatchOdds[] = [];
    const upcoming: MatchOdds[] = [];
    filteredMatches.forEach((match) => {
      const start = Date.parse(match.commence_time);
      if (isNaN(start)) return;
      if (isMatchLive(match)) {
        live.push(match);
      } else if (start > now) {
        upcoming.push(match);
      }
    });
    return [
      { title: `🔴 Live Matches (${live.length})`, key: "live", data: live },
      { title: `📅 Upcoming Matches (${upcoming.length})`, key: "upcoming", data: upcoming },
    ];
  }, [filteredMatches, isMatchLive, now]);

  // --- UI renderers ---
  const renderMatchCard = useCallback(
    ({ item }: { item: MatchOdds }) => {
      const scoreLine = getScoreLine(item);
      const live = isMatchLive(item);
      const kickoff = new Date(item.commence_time);

      return (
        <Pressable
          style={({ pressed }) => [
            styles.matchCard,
            pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] },
          ]}
          onPress={() => {
            setSelectedMatch(item);
            setIsDetailsOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.home_team} vs ${item.away_team}`}
          hitSlop={8}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.matchTeams} numberOfLines={1}>
              {item.home_team} vs {item.away_team}
            </Text>
            {live && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {scoreLine ? (
            <Text style={styles.scoreLine} accessibilityLabel={`Score ${scoreLine}`}>
              {scoreLine}
            </Text>
          ) : (
            <Text style={styles.kickoffText} numberOfLines={1}>
              {item.sport_title} • {kickoff.toLocaleString()}
            </Text>
          )}
        </Pressable>
      );
    },
    [getScoreLine, isMatchLive, styles]
  );

  const handleConfirmBet = useCallback(() => {
    if (confirmData) {
      const amount = Number(stake);
      if (!amount || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid stake amount.");
        return;
      }
      alert(`Bet placed on ${confirmData.team} at the odds of ${confirmData.price} for ${amount}`);
    }
    setConfirmVisible(false);
    setConfirmData(null);
  }, [confirmData, stake]);

  // header content used inside SectionList's ListHeaderComponent
  const ListHeader = (
    <View>
      {/* Top bar */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>SportsBet Explorer</Text>
        <Pressable
          onPress={() => router.push("/profile")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Ionicons style={styles.icon} name="person" size={22} color={C.text} />
        </Pressable>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search teams or leagues..."
        placeholderTextColor={C.subtext}
        value={searchTerm}
        onChangeText={setSearchTerm}
        returnKeyType="search"
        clearButtonMode="while-editing"
        cursorColor={C.primary}
      />

      {/* Sport Filter (horizontal chips) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {SPORTS.map((sport) => {
          const active = selectedSport === sport;
          return (
            <Pressable
              key={sport}
              onPress={() => setSelectedSport(sport)}
              style={({ pressed }) => [
                styles.filterButton,
                active && styles.filterButtonActive,
                pressed && { opacity: 0.9 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter: ${sport === "all" ? "All Sports" : sport}`}
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
    <SafeAreaView style={[styles.container]}>      
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
          renderSectionFooter={({ section }) =>
            section.data.length === 0 ? (
              <Text style={styles.noMatches}>No matches {section.key === "live" ? "live right now." : "found."}</Text>
            ) : null
          }
          stickySectionHeadersEnabled
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Match Details Modal */}
      <Modal
        visible={isDetailsOpen}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setIsDetailsOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer]}> 
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalTopBar}>
              <Pressable
                onPress={() => setIsDetailsOpen(false)}
                style={styles.closeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close details"
              >
                <Ionicons name="chevron-down" size={22} color={C.text} />
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>

              {/* Wallet bar */}
              <View style={styles.walletBar}>
                <Ionicons name="wallet" size={18} color={C.text} />
                {walletLoading ? (
                  <Text style={styles.walletText}>Loading balance...</Text>
                ) : walletError ? (
                  <Text style={[styles.walletText, { color: C.error }]}>{walletError}</Text>
                ) : (
                  <Text style={styles.walletText}>
                    Balance: {wallet ? formatCurrency(wallet.amount, wallet.currency) : "--"}
                  </Text>
                )}
              </View>
            </View>

            {selectedMatch && (
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ marginBottom: 12 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {selectedMatch.home_team} vs {selectedMatch.away_team}
                    </Text>
                    {isMatchLive(selectedMatch) && (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  {(() => {
                    const s = getScoreLine(selectedMatch);
                    const lu = scoresById[selectedMatch.id]?.last_update;
                    return (
                      <>
                        {s && <Text style={styles.scoreLineBig}>{s}</Text>}
                        {lu && (
                          <Text style={styles.lastUpdate}>Updated {new Date(lu).toLocaleTimeString()}</Text>
                        )}
                      </>
                    );
                  })()}
                </View>

                {selectedMatch?.bookmakers?.map((book) => (
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
                              <Text style={styles.oddsTeam} numberOfLines={1}>
                                {o.name?.toLowerCase() === "draw" ? "Draw" : o.name}
                              </Text>
                              <Text style={styles.oddsPrice}>{o.price}</Text>
                            </View>
                            <Pressable
                              style={({ pressed }) => [styles.oddsButton, pressed && { opacity: 0.85 }]}
                              onPress={() => {
                                setConfirmData({ team: o.name, price: o.price });
                                setStake("");
                                setConfirmVisible(true);
                              }}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Bet on ${o.name} at ${o.price}`}
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

      {/* Confirm Popup */}
      <Modal
        visible={!!confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.popupOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmVisible(false)} />
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Confirm Bet</Text>
            <Text style={styles.popupText}>
              Place bet on <Text style={styles.popupStrong}>{confirmData?.team}</Text> at the odds of
              <Text style={styles.popupStrong}> {confirmData?.price}</Text>?
            </Text>
            <TextInput
              value={stake}
              onChangeText={setStake}
              placeholder="Enter your bet"
              placeholderTextColor={C.subtext}
              keyboardType="decimal-pad"
              style={styles.popupInput}
              returnKeyType="done"
            />
            <View style={styles.popupActions}>
              <Pressable
                style={({ pressed }) => [styles.popupBtn, styles.popupCancel, pressed && { opacity: 0.9 }]}
                onPress={() => setConfirmVisible(false)}
                hitSlop={8}
              >
                <Text style={styles.popupBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.popupBtn, styles.popupConfirm, pressed && { opacity: 0.9 }]}
                onPress={handleConfirmBet}
                hitSlop={8}
              >
                <Text style={[styles.popupBtnText, styles.popupConfirmText]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ---- theme helpers ----
function getColors(scheme: "light" | "dark") {
  return {
    bg: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
    card: scheme === "dark" ? "#151515" : "#FFFFFF",
    border: scheme === "dark" ? "#262626" : "#E6E6E6",
    text: scheme === "dark" ? "#FFFFFF" : "#111111",
    subtext: scheme === "dark" ? "#A0A0A0" : "#555555",
    primary: "#111111",
    chip: scheme === "dark" ? "#1A1A1A" : "#F4F4F4",
    chipText: scheme === "dark" ? "#EAEAEA" : "#1A1A1A",
    error: "#B00020",
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
      paddingHorizontal: 4,
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

    filterRow: { paddingVertical: 6, paddingRight: 4 },
    filterButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 999,
      marginRight: 8,
      backgroundColor: C.chip,
      minHeight: 40,
      justifyContent: "center",
    },
    filterButtonActive: { backgroundColor: C.text },
    filterText: { fontSize: 13, color: C.chipText, fontWeight: "600" },
    filterTextActive: { color: C.bg },

    sectionHeader: { paddingTop: 6, paddingBottom: 6, backgroundColor: C.bg },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
    noMatches: { fontSize: 14, color: C.subtext, paddingVertical: 6 },

    matchCard: {
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: C.card,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    matchTeams: { fontSize: 16, fontWeight: "600", color: C.text, flex: 1, paddingRight: 8 },

    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "#FFE8E8",
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "red", marginRight: 6 },
    liveText: { fontSize: 12, fontWeight: "700", color: "red" },

    scoreLine: { fontSize: 15, fontWeight: "600", color: C.text, marginTop: 6 },
    kickoffText: { fontSize: 13, color: C.subtext, marginTop: 6 },

    modalContainer: { flex: 1, backgroundColor: C.bg },
    modalTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    closeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    closeBtnText: { color: C.text, fontSize: 14, fontWeight: "600", marginLeft: 6 },

    walletBar: { flexDirection: "row", alignItems: "center" },
    walletText: { marginLeft: 6, fontSize: 14, color: C.text },

    titleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginTop: 12 },
    modalTitle: { fontSize: 20, fontWeight: "700", color: C.text, flex: 1 },
    scoreLineBig: { fontSize: 22, fontWeight: "800", marginTop: 8, color: C.text, paddingHorizontal: 12 },
    lastUpdate: { fontSize: 12, color: C.subtext, paddingHorizontal: 12 },

    bookmakerSection: { marginTop: 12, paddingHorizontal: 12 },
    bookmakerTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: C.text },

    oddsCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      marginBottom: 8,
      backgroundColor: C.card,
    },
    oddsInfo: { flexDirection: "row", alignItems: "center" },
    oddsTeam: { fontSize: 14, color: C.text, maxWidth: "70%" },
    oddsPrice: { fontSize: 14, fontWeight: "800", color: C.text, marginLeft: 10 },
    oddsButton: { backgroundColor: C.text, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minHeight: 36, justifyContent: "center" },
    oddsButtonText: { color: C.bg, fontWeight: "700", fontSize: 14 },

    popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    popupCard: { width: "88%", backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
    popupTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: C.text },
    popupText: { fontSize: 14, marginBottom: 10, color: C.text },
    popupStrong: { fontWeight: "800" },
    popupInput: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
      color: C.text,
      backgroundColor: C.bg,
    },
    popupActions: { flexDirection: "row", justifyContent: "flex-end" },
    popupBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, minHeight: 40, justifyContent: "center" },
    popupCancel: { backgroundColor: C.chip, marginRight: 8 },
    popupConfirm: { backgroundColor: C.text },
    popupBtnText: { fontSize: 14, color: C.text },
    popupConfirmText: { color: C.bg, fontWeight: "800" },
  });
}
