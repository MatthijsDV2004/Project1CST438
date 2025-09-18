import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image} from "react-native";
import { Pressable,Button } from 'react-native';
import { useRouter } from "expo-router";

const router = useRouter();
export default function AddPayment() {
  const handlePress = (method: string) => {
    Alert.alert(method, "Coming Soon!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Payment Method</Text>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("PayPal")}>
        <View style={styles.row}>
          <Text style={styles.cardText}>Add PayPal</Text>
          <Image source={require("../../assets/images/pp.png")} style={styles.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("Apple Pay")}>
        <View style={styles.row}>
          <Text style={styles.cardText}>Add Apple Pay</Text>
          <Image source={require("../../assets/images/apple.png")} style={styles.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("Card")}>
        <View style={styles.row}>
          <Text style={styles.cardText}>Add Card</Text>
          <Image source={require("../../assets/images/cc.png")} style={styles.icon} />
        </View>
      </TouchableOpacity>
      <Pressable
      style={styles.button}
      onPress={() => router.push("/Profile")}
    >
      <Text style={styles.buttonText}>Back</Text>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  button: {
    marginTop: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#5B21B6",
  },
  card: {
    width: "90%",
    backgroundColor: "#EDE9FE",
    paddingVertical: 16,
    borderRadius: 16,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5B21B6",
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});