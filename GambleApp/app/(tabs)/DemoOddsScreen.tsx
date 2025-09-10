import React, { useEffect,useState, useMemo, use } from 'react';
import{View,Text, Button, FlatList,ActivityIndicator,StyleSheet,TextInput,TouchableOpacity, Modal, ScrollView} from 'react-native'
import{fetchMatchOdds,MatchOdds,} from '../../src/api/oddsApi';


const SPORTS = ['soccer_epl', 'basketball_nba'];
const PAGESIZE = 5;

export default function SportsBetExplorerPage() {
const [matches, setMatches] = useState<MatchOdds[]>([]);
const[loading,setLoading]=useState(false);
const [sportsIndex, setSportsIndex] = useState(0);
const[startIndex,setStartIndex]=useState(0);
const [searchTerm,setSearchTerm]=useState('');
const [selectedMatch,setSelectedMatch]=useState<MatchOdds|null>(null);
const[showDetails,setShowDetails]=useState(false);


//start by fetching data from api
const loadMatches = async ()=>{setLoading(true);
  try{
    const allMatches=await fetchMatchOdds(SPORTS[sportsIndex]);
    const nextMatches=allMatches.slice(startIndex,startIndex+PAGESIZE);
    setMatches(nextMatches)
  }
  catch(error){
    console.error('Error fetching match odds:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  }
  finally{
    setLoading(false);
  }
};
useEffect(()=>{
  loadMatches();
},[sportsIndex,startIndex]);

//filter matches based on search input
const filteredMatches=useMemo(()=>{
  if(!searchTerm) return matches;
  return matches.filter(
    (match) =>
      match.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_team.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [matches, searchTerm]);

//this function will handle the division between upcoming and live matches
const liveMatches = filteredMatches.filter(
  (match) => {
    const now = Date.now();
    return match.commence_time &&
      new Date(match.commence_time).getTime() <= now;
  }
);
const upcomingMatches = filteredMatches.filter((match) => {
  const now = Date.now();
  return match.commence_time &&
    new Date(match.commence_time).getTime() > now;
});
console.log('Upcoming Matches:', upcomingMatches);
console.log('Live Matches:', liveMatches);
console.log('Filtered Matches:', filteredMatches);

console.log('Upcoming Matches:', upcomingMatches);
console.log('Live Matches:', liveMatches);
console.log('Filtered Matches:', filteredMatches);
const handleLoadMore=()=>{
  setSportsIndex((prevIndex)=>(prevIndex+1)%SPORTS.length);
  setStartIndex(0);
};

const renderMatchCard=({item}:{item:MatchOdds})=>(
  <TouchableOpacity style={styles.matchCard} onPress={()=>{
    setSelectedMatch(item);
    setShowDetails(true);
  }}>
     <Text style={styles.matchTeams}>
        {item.home_team} vs {item.away_team}
      </Text>
      <Text style={styles.league}>
        {SPORTS[sportsIndex].toUpperCase()}
      </Text>
  </TouchableOpacity>
);
//header 
return(
  <View style={styles.container}>
    <Text style={styles.header}>Sports Bet Explorer</Text>
    <TextInput
      style={styles.searchBar}
      placeholder="Search teams..."
      value={searchTerm}
      onChangeText={setSearchTerm}
    />
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
                keyExtractor={(item) => item.id}
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
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Load More Button */}
          <Button title="Switch Sport" onPress={handleLoadMore} />
        </ScrollView>
      )}

      {/* Match Details Modal */}
      <Modal visible={showDetails} animationType="slide">
        <View style={styles.modalContainer}>
          <Button title="Close" onPress={() => setShowDetails(false)} />
          {selectedMatch && (
            <ScrollView>
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
    marginBottom: 16 
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  matchCard: { 
    padding: 12, 
    backgroundColor: "#fff", 
    marginBottom: 8, 
    borderRadius: 8, 
    elevation: 1 
  },
  matchTeams: { fontSize: 16, fontWeight: "bold" },
  league: { fontSize: 14, color: "#666" },
  noMatches: { textAlign: "center", color: "#666", marginTop: 8 },
  modalContainer: { flex: 1, padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  bookmakerSection: { marginVertical: 8 },
  bookmakerTitle: { fontWeight: "600", marginTop: 6 },
});