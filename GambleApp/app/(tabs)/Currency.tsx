import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter, Link } from 'expo-router';
import { useSQLiteContext } from "expo-sqlite";
import { useSession } from '../../lib/sessionContext';


const router = useRouter();

export default function PurchaseScreen() {
  const db = useSQLiteContext();
  const {user} = useSession();
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [lastSelected, setLastSelected] = useState<number | null>(null);
  const navigation = useNavigation();
  
  const options = [ //will update later with more acurate resemblance for curency values
    { price: 4.99, credits: 500, img: require("../../assets/images/vbuck1.png") },
    { price: 9.99, credits: 1200, img: require("../../assets/images/vbuck2.png") },
    { price: 24.99, credits: 3500, img: require("../../assets/images/vbuck3.png") },
    { price: 49.99, credits: 7500, img: require("../../assets/images/vbuck4.png") },
    { price: 99.99, credits: 16000, img: require("../../assets/images/vbuck5.png") },
  ];

  const handlePurchase = (credits: number, idx: number) => {
    setTotalCredits(prev => prev + credits); // adds credits to total (balance)
    setLastSelected(idx);
  };
  {user?.currency}  setTotalCredits;
  return (
    //total credits indicator shown on the top right
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.paymentButton}
        onPress={() => navigation.navigate("addPayment" as never)}
      >
        <Text style={styles.paymentButtonText}>Add Payment Method</Text>
      </TouchableOpacity>
      <Pressable
      style={styles.button}
      onPress={() => router.push("/Profile")}
    >
      <Text style={styles.buttonText}>Back</Text>
    </Pressable>
      <Text style={styles.creditsIndicator}>
        {totalCredits.toLocaleString()} Credits
      </Text>

      <Text style={styles.title}>Buy Credits</Text>
      
      <ScrollView>

      <View style={styles.grid}>
        {options.map((opt, idx) => {
          const isSelected = idx === lastSelected;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => handlePurchase(opt.credits, idx)}
            >
              <Image source={opt.img} style={styles.image} resizeMode="contain" />

              <Text style={styles.creditsText}>{opt.credits} Credits</Text>
              <Text style={styles.price}>${opt.price.toFixed(2)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
    alignItems: "center",
  },
   paymentButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  creditsIndicator: {
    position: "absolute",
    top: 40,
    right: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 60,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
    },
    button: {
      marginTop: 14,
      backgroundColor: '#4f46e5',
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  card: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#7c3aed",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  image: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7c3aed",
  },
});
