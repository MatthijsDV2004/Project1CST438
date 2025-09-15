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
import { fetchMatchOdds, MatchOdds } from "../../src/api/oddsApi";

const SPORTS = ["all", "soccer_epl", "basketball_nba", "americanfootball_nfl"];
const PAGESIZE = 10;

export default function SportsBetExplorerPage() {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>SportsBet Explorer</Text>

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
          {selectedMatch && (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.modalTitle}>
                {selectedMatch.home_team} vs {selectedMatch.away_team}
              </Text>
              <Text>Start Time: {selectedMatch.commence_time}</Text>
              {selectedMatch.bookmakers.map((book) => (
                <View key={book.key} style={styles.bookmakerSection}>
                  <Text style={styles.bookmakerTitle}>{book.title}</Text>
                  {book.markets.map((market) =>
                    market.outcomes.map((o) => (
                      <Text key={o.name}>
                        {o.name}: {o.price}
                      </Text>
                    ))
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  filterRow: { flexDirection: "row", marginBottom: 2 }, // reduced marginBottom
 filterButton: {
  paddingTop: 4,        // smaller top padding
  paddingBottom: 4,     // smaller bottom padding
  paddingHorizontal: 10, // keep horizontal spacing nice
  borderRadius: 12,     // slightly smaller rounded corners
  borderWidth: 1,
  borderColor: '#ccc',
  marginRight: 6,       // a bit less spacing between buttons
},
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterText: { color: "#333" },
  filterTextActive: { color: "#fff" },
  section: { marginBottom: 20},
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
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
});
