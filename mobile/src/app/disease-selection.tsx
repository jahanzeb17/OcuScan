import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DISEASES } from "../constants/diseases";

export default function DiseaseSelectionScreen() {
  const { uri, width, height } = useLocalSearchParams<{
    uri?: string;
    width?: string;
    height?: string;
  }>();

  // expo-router auto-decodes params on read (exactly once) — this is already
  // the real file path. Do NOT decode again. Only re-encode when pushing forward.
  const imageUri = Array.isArray(uri) ? uri[0] : (uri ?? "");

  const handleDiseaseSelect = (diseaseId: string) => {
    router.push({
      pathname: "/subtype-selection",
      params: {
        diseaseId,
        uri: encodeURIComponent(imageUri),
        width: width ?? "",
        height: height ?? "",
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>Select Disease</Text>
      <Text style={styles.subtitle}>
        Choose the disease associated with this image.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {DISEASES.map((disease) => (
          <Pressable
            key={disease.id}
            style={styles.card}
            onPress={() => handleDiseaseSelect(disease.id)}
          >
            <Text style={styles.cardTitle}>{disease.name}</Text>
            <Text style={styles.cardSubtitle}>Select this disease</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
  },

  list: {
    paddingTop: 25,
    paddingBottom: 30,
    gap: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  cardSubtitle: {
    marginTop: 6,
    color: "#6B7280",
  },
});
