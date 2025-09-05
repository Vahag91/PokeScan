import React from "react";
import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";

export default function BottomSection({ chartData, setChartData }) {
  const scheme = useColorScheme();
  const bg = scheme === "dark" ? "#111" : "#f2f2f2";
  const fg = scheme === "dark" ? "#fff" : "#000";

  return (
    <>
      <View style={[styles.cardWrap, { backgroundColor: "transparent" }]}>
        <View style={[styles.card, { backgroundColor: bg }]}>
          <Text style={[styles.title, { color: fg }]}>Apple Computers</Text>
          <Text style={[styles.subtitle, { color: fg }]}>NASDAQ</Text>
          <Text style={[styles.caption, { color: fg }]}>Past Year</Text>
        </View>
      </View>

      <Pressable
        onPress={() => setChartData("toggle")}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.7 : 1, backgroundColor: "#2e7d32" },
        ]}
      >
        <Text style={styles.buttonText}>Update Chart</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginTop: 5,
    paddingTop: 10,
    width: "95%",
    height: "30%",
    justifyContent: "center",
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  caption: { fontSize: 16 },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  buttonText: { color: "white", fontSize: 18, textAlign: "center" },
});
