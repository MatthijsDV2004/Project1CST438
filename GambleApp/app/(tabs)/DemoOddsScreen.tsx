import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { fetchMatchOdds, MatchOdds } from "../../src/api/oddsApi";

const SPORTS = ["soccer_epl", "basketball_nba"]; // toggle between two sports
const PAGE_SIZE = 5;

export default function DemoOddsScreen() {
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [sportIndex, setSportIndex] = useState(0); // 0 = EPL, 1 = NBA
  const [startIndex, setStartIndex] = useState(0); // Temporary for now

  const loadMatches = async () => {
    setLoading(true);
    try {
      const allMatches = await fetchMatchOdds(SPORTS[sportIndex]);
      const nextMatches = allMatches.slice(startIndex, startIndex + PAGE_SIZE);
      setMatches(nextMatches);
    } catch (err: any) {
      console.error("Error fetching odds FULL:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error("Axios error config:", err.config);
      console.error("Axios error request:", err.request);
    } finally {
      setLoading(false);
    }
  };
  //updates the 5 most recent matches to games that are soon to start and gets rid of teh games that have already started.

  useEffect(() => {
    loadMatches();
  }, [sportIndex, startIndex]);

  const handleLoadMore = () => {
    // toggle sport for simplicity
    setSportIndex((prev) => (prev + 1) % SPORTS.length);
    setStartIndex(0); 
// reset to first 5 results to save api credits
  };

  const renderItem = ({ item }: { item: MatchOdds }) => (
    <View style={styles.matchContainer}>
      <Text style={styles.teams}>
        {item.home_team} vs {item.away_team}
      </Text>
      {item.bookmakers.map((book) => (
        <View key={book.key}>
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
    </View>
  ); //displays match ups and a handfull of sportsbook odds.

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <FlatList
            data={matches}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
          <Button title="Load More" onPress={handleLoadMore} />
        </>
      )}
    </View>
  );
}
//switches from english soccer to NBA.

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#grey" },
  matchContainer: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#darkgrey", paddingBottom: 8 },
  teams: { fontWeight: "bold", fontSize: 16 },
  bookmakerTitle: { marginTop: 4, fontStyle: "italic" },
});// basic styling that will more then likely be replaced.
