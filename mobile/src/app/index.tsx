import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";

import * as ImagePicker from "expo-image-picker";

import { getAccessToken } from "../utils/auth";
import { removeAccessToken } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

// const API_BASE_URL = "http://172.16.2.22:8000";

interface MyStats {
  total_images: number;
  disease_counts: {
    conjunctivitis: number;
    pterygium: number;
    strabismus: number;
  };
}

interface MyImage {
  image_id: number;
  filename: string;
  disease: string;
  subtype: string;
  width: number;
  height: number;
  content_type: string;
  created_at: string;
}

interface AdminDoctor {
  doctor_id: number;
  name: string;
  email: string;
  hospital: string | null;
  city: string | null;
  experience: number | null;
  qualification: string | null;
  designation: string | null;
  created_at: string;
  is_active: boolean;
  profile_photo_url: string | null;
  total_images: number;
  disease_counts: {
    conjunctivitis: number;
    pterygium: number;
    strabismus: number;
  };
  subtype_counts: Record<string, number>;
}

interface AdminDashboard {
  admin: {
    doctor_id: number;
    name: string;
    email: string;
  };
  total_doctors: number;
  total_images: number;
  disease_counts: {
    conjunctivitis: number;
    pterygium: number;
    strabismus: number;
  };
  subtype_counts: Record<string, number>;
  doctors: AdminDoctor[];
}

interface CurrentUser {
  doctor_id: number;
  name: string;
  email: string;
  role: string;
  profile_photo_url: string | null;
}

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [accessToken, setAccessToken] = useState("");

  const [myStats, setMyStats] = useState<MyStats>({
    total_images: 0,
    disease_counts: {
      conjunctivitis: 0,
      pterygium: 0,
      strabismus: 0,
    },
  });

  const [myImages, setMyImages] = useState<MyImage[]>([]);

  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await removeAccessToken();
    router.replace("/login");
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      setAccessToken(accessToken);

      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers,
      });

      if (meResponse.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");

        router.replace("/login");
        return;
      }

      if (!meResponse.ok) {
        throw new Error("Failed to load account.");
      }

      const user: CurrentUser = await meResponse.json();

      setCurrentUser(user);

      if (user.role === "admin") {
        const adminResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          method: "GET",
          headers,
        });

        if (adminResponse.status === 401) {
          router.replace("/login");
          return;
        }

        if (adminResponse.status === 403) {
          throw new Error("Admin access was denied.");
        }

        if (!adminResponse.ok) {
          throw new Error("Failed to load admin dashboard.");
        }

        const adminData = await adminResponse.json();

        setAdminDashboard(adminData);

        return;
      }

      const [statsResponse, imagesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/my/stats`, {
          method: "GET",
          headers,
        }),

        fetch(`${API_BASE_URL}/my/images`, {
          method: "GET",
          headers,
        }),
      ]);

      if (statsResponse.status === 401 || imagesResponse.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");

        router.replace("/login");
        return;
      }

      if (!statsResponse.ok) {
        throw new Error("Failed to load image statistics.");
      }

      if (!imagesResponse.ok) {
        throw new Error("Failed to load uploaded images.");
      }

      const statsData = await statsResponse.json();

      const imagesData = await imagesResponse.json();

      setMyStats({
        total_images: Number(statsData.total_images ?? 0),

        disease_counts: {
          conjunctivitis: Number(statsData.disease_counts?.conjunctivitis ?? 0),

          pterygium: Number(statsData.disease_counts?.pterygium ?? 0),

          strabismus: Number(statsData.disease_counts?.strabismus ?? 0),
        },
      });

      setMyImages(Array.isArray(imagesData.images) ? imagesData.images : []);
    } catch (error) {
      console.log("========== DASHBOARD ERROR ==========", error);

      Alert.alert("Unable to Load Data", "Could not load your OcuScan data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingScreenText}>Loading OcuScan...</Text>
      </View>
    );
  }

  if (currentUser?.role === "admin" && adminDashboard) {
    return (
      <AdminDashboardView
        dashboard={adminDashboard}
        accessToken={accessToken}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <DoctorHome
      stats={myStats}
      images={myImages}
      currentUser={currentUser}
      accessToken={accessToken}
      onLogout={handleLogout}
    />
  );
}

/* ============================================================
   DOCTOR / USER HOME
   ============================================================ */

function DoctorHome({
  stats,
  images,
  currentUser,
  accessToken,
  onLogout,
}: {
  stats: MyStats;
  images: MyImage[];
  currentUser: CurrentUser | null;
  accessToken: string;
  onLogout: () => Promise<void>;
}) {
  const handleLogout = async () => {
    await removeAccessToken();
    router.replace("/login");
  };

  const handleCapture = () => {
    console.log("========== CAPTURE PRESSED ==========");

    router.push("/camera");
  };

  const handleGallery = async () => {
    console.log("========== GALLERY PRESSED ==========");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access to select an image.",
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) {
      console.log("Gallery selection cancelled");

      return;
    }

    const asset = result.assets[0];

    console.log("========== IMAGE SELECTED ==========");

    console.log("URI:", asset.uri);

    console.log("Width:", asset.width);

    console.log("Height:", asset.height);

    router.push({
      pathname: "/photo-preview",
      params: {
        uri: encodeURIComponent(asset.uri),
        width: String(asset.width ?? ""),
        height: String(asset.height ?? ""),
      },
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString();
  };

  const diseaseCount = (
    disease: "conjunctivitis" | "pterygium" | "strabismus",
  ) => {
    return stats.disease_counts[disease];
  };

  const handleDiseasePress = (disease: string) => {
    const diseaseKey = disease.toLowerCase();

    const diseaseImages = images.filter(
      (item) => item.disease.toLowerCase() === diseaseKey,
    );

    const subtypeCounts = diseaseImages.reduce<Record<string, number>>(
      (counts, item) => {
        counts[item.subtype] = (counts[item.subtype] ?? 0) + 1;
        return counts;
      },
      {},
    );

    const subtypeSummary = Object.entries(subtypeCounts)
      .map(([subtype, count]) => `${subtype}: ${count}`)
      .join("\n");

    Alert.alert(
      `${disease} Subtype Counts`,
      subtypeSummary || "No subtype images uploaded yet.",
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>OcuScan</Text>

            <Text style={styles.headerSubtitle}>
              {currentUser?.name
                ? `Welcome, ${currentUser.name}`
                : "Eye Image Collection"}
            </Text>
          </View>

          <View style={styles.profilePhotoButton}>
            {currentUser?.profile_photo_url ? (
              <Image
                source={{
                  uri: `${API_BASE_URL}${currentUser.profile_photo_url}`,
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }}
                style={styles.headerProfilePhoto}
              />
            ) : (
              <Ionicons name="person-outline" size={22} color="#1F2937" />
            )}
          </View>

          <Pressable
            style={styles.logoutIconButton}
            onPress={onLogout}
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </Pressable>
        </View>

        {/* Capture Images */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Capture Images</Text>

          <Text style={styles.sectionSubtitle}>
            Capture a new image or select one from your device
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCapture}
          >
            <Ionicons name="camera" size={22} color="#FFFFFF" />

            <Text style={styles.primaryButtonText}>Capture</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGallery}
          >
            <Ionicons name="images-outline" size={22} color="#2563EB" />

            <Text style={styles.secondaryButtonText}>Gallery</Text>
          </Pressable>
        </View>

        {/* My Collection */}
        <View style={styles.collectionCard}>
          <View style={styles.collectionHeader}>
            <View>
              <Text style={styles.collectionTitle}>My Collection</Text>

              <Text style={styles.collectionSubtitle}>
                Your uploaded eye images
              </Text>
            </View>

            <Ionicons name="images-outline" size={26} color="#2563EB" />
          </View>

          <View style={styles.totalImagesBox}>
            <Text style={styles.totalImagesLabel}>Total Images</Text>

            <Text style={styles.totalImagesCount}>{stats.total_images}</Text>
          </View>

          <View style={styles.personalDiseaseRow}>
            <View style={styles.personalDiseaseItem}>
              <Text style={styles.personalDiseaseCount}>
                {diseaseCount("conjunctivitis")}
              </Text>

              <Text style={styles.personalDiseaseLabel}>Conjunctivitis</Text>
            </View>

            <View style={styles.personalDiseaseItem}>
              <Text style={styles.personalDiseaseCount}>
                {diseaseCount("pterygium")}
              </Text>

              <Text style={styles.personalDiseaseLabel}>Pterygium</Text>
            </View>

            <View style={styles.personalDiseaseItem}>
              <Text style={styles.personalDiseaseCount}>
                {diseaseCount("strabismus")}
              </Text>

              <Text style={styles.personalDiseaseLabel}>Strabismus</Text>
            </View>
          </View>
        </View>

        {/* My Uploaded Images */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Uploaded Images</Text>

          <Text style={styles.sectionSubtitle}>
            Your images stored in OcuScan
          </Text>
        </View>

        <View style={styles.myImagesList}>
          {(
            [
              {
                disease: "Conjunctivitis",
                key: "conjunctivitis",
                count: stats.disease_counts.conjunctivitis,
              },
              {
                disease: "Pterygium",
                key: "pterygium",
                count: stats.disease_counts.pterygium,
              },
              {
                disease: "Strabismus",
                key: "strabismus",
                count: stats.disease_counts.strabismus,
              },
            ] as const
          ).map((disease) => {
            const firstImage = images.find(
              (image) => image.disease.toLowerCase() === disease.key,
            );

            return (
              <Pressable
                key={disease.key}
                style={({ pressed }) => [
                  styles.myImageCard,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handleDiseasePress(disease.disease)}
              >
                {firstImage ? (
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/images/${firstImage.image_id}`,
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }}
                    style={styles.imageThumbnail}
                  />
                ) : (
                  <View style={styles.imageThumbnailPlaceholder}>
                    <Ionicons name="images-outline" size={30} color="#94A3B8" />
                  </View>
                )}

                <View style={styles.myImageInfo}>
                  <Text style={styles.myImageDisease}>{disease.disease}</Text>

                  <Text style={styles.myImageSubtype}>
                    {disease.count} {disease.count === 1 ? "image" : "images"}
                  </Text>

                  <Text style={styles.myImageDetails}>
                    Tap to see subtype counts
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-outline"
                  size={22}
                  color="#64748B"
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

function AdminDashboardView({
  dashboard,
  accessToken,
  onLogout,
}: {
  dashboard: AdminDashboard;
  accessToken: string;
  onLogout: () => Promise<void>;
}) {
  const handleOverallDiseasePress = (disease: string) => {
    const diseaseKey = disease.toLowerCase();

    const subtypeCounts = Object.entries(dashboard.subtype_counts)
      .filter(([subtype]) => subtype.toLowerCase().includes(diseaseKey))
      .filter(([, count]) => count > 0);

    const subtypeSummary = subtypeCounts
      .map(([subtype, count]) => `${subtype}: ${count}`)
      .join("\n");

    Alert.alert(
      `${disease} - All Doctors`,
      subtypeSummary || "No subtype images uploaded yet.",
    );
  };

  const handleDoctorPress = (doctor: AdminDoctor) => {
    const diseaseSections = [
      {
        name: "Conjunctivitis",
        key: "conjunctivitis",
        count: doctor.disease_counts.conjunctivitis,
      },
      {
        name: "Pterygium",
        key: "pterygium",
        count: doctor.disease_counts.pterygium,
      },
      {
        name: "Strabismus",
        key: "strabismus",
        count: doctor.disease_counts.strabismus,
      },
    ];

    const summary = diseaseSections
      .map((disease) => {
        const subtypes = Object.entries(doctor.subtype_counts)
          .filter(
            ([subtype, count]) =>
              count > 0 && subtype.toLowerCase().includes(disease.key),
          )
          .map(([subtype, count]) => `  ${subtype}: ${count}`)
          .join("\n");

        return (
          `${disease.name}: ${disease.count}` +
          (subtypes ? `\n${subtypes}` : "")
        );
      })
      .join("\n\n");

    Alert.alert(
      `${doctor.name} - Image Types`,
      summary || "No images uploaded yet.",
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>OcuScan</Text>

            <Text style={styles.adminHeaderSubtitle}>Admin Dashboard</Text>
          </View>

          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#2563EB"
            />
          </View>

          <Pressable
            style={styles.logoutIconButton}
            onPress={onLogout}
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </Pressable>
        </View>

        {/* Admin information */}
        <View style={styles.adminInfoCard}>
          <Text style={styles.adminInfoTitle}>Administrator</Text>

          <Text style={styles.adminInfoName}>{dashboard.admin.name}</Text>

          <Text style={styles.adminInfoEmail}>{dashboard.admin.email}</Text>
        </View>

        {/* Overall Statistics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>

          <Text style={styles.sectionSubtitle}>
            Data collected from all doctors
          </Text>
        </View>

        <View style={styles.adminStatsGrid}>
          <View style={styles.adminStatCard}>
            <Text style={styles.adminStatNumber}>
              {dashboard.total_doctors}
            </Text>

            <Text style={styles.adminStatLabel}>Doctors</Text>
          </View>

          <View style={styles.adminStatCard}>
            <Text style={styles.adminStatNumber}>{dashboard.total_images}</Text>

            <Text style={styles.adminStatLabel}>Total Images</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.adminStatCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOverallDiseasePress("Conjunctivitis")}
          >
            <Text style={styles.adminStatNumber}>
              {dashboard.disease_counts.conjunctivitis}
            </Text>

            <Text style={styles.adminStatLabel}>Conjunctivitis</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.adminStatCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOverallDiseasePress("Pterygium")}
          >
            <Text style={styles.adminStatNumber}>
              {dashboard.disease_counts.pterygium}
            </Text>

            <Text style={styles.adminStatLabel}>Pterygium</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.adminStatCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOverallDiseasePress("Strabismus")}
          >
            <Text style={styles.adminStatNumber}>
              {dashboard.disease_counts.strabismus}
            </Text>

            <Text style={styles.adminStatLabel}>Strabismus</Text>
          </Pressable>
        </View>

        {/* Doctors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registered Doctors</Text>

          <Text style={styles.sectionSubtitle}>
            Individual collection statistics
          </Text>
        </View>

        <View style={styles.doctorList}>
          {dashboard.doctors.length === 0 ? (
            <View style={styles.emptyImagesCard}>
              <Ionicons name="people-outline" size={36} color="#94A3B8" />

              <Text style={styles.emptyImagesTitle}>
                No doctors registered yet
              </Text>
            </View>
          ) : (
            dashboard.doctors.map((doctor) => (
              <Pressable
                key={doctor.doctor_id}
                style={({ pressed }) => [
                  styles.doctorCard,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handleDoctorPress(doctor)}
              >
                <View style={styles.doctorHeader}>
                  <View style={styles.doctorAvatar}>
                    {doctor.profile_photo_url ? (
                      <Image
                        source={{
                          uri: `${API_BASE_URL}${doctor.profile_photo_url}`,
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                          },
                        }}
                        style={styles.doctorProfilePhoto}
                      />
                    ) : (
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="#2563EB"
                      />
                    )}
                  </View>

                  <View style={styles.doctorIdentity}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>

                    <Text style={styles.doctorEmail}>{doctor.email}</Text>
                  </View>
                </View>

                <View style={styles.doctorDetails}>
                  {doctor.hospital ? (
                    <Text style={styles.doctorDetailText}>
                      Hospital: {doctor.hospital}
                    </Text>
                  ) : null}

                  {doctor.city ? (
                    <Text style={styles.doctorDetailText}>
                      City: {doctor.city}
                    </Text>
                  ) : null}

                  {doctor.qualification ? (
                    <Text style={styles.doctorDetailText}>
                      Qualification: {doctor.qualification}
                    </Text>
                  ) : null}

                  {doctor.designation ? (
                    <Text style={styles.doctorDetailText}>
                      Designation: {doctor.designation}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.doctorTotalBox}>
                  <Text style={styles.doctorTotalNumber}>
                    {doctor.total_images}
                  </Text>

                  <Text style={styles.doctorTotalLabel}>Total Images</Text>
                </View>

                <View style={styles.doctorDiseaseRow}>
                  <View style={styles.doctorDiseaseItem}>
                    <Text style={styles.doctorDiseaseNumber}>
                      {doctor.disease_counts.conjunctivitis}
                    </Text>

                    <Text style={styles.doctorDiseaseLabel}>
                      Conjunctivitis
                    </Text>
                  </View>

                  <View style={styles.doctorDiseaseItem}>
                    <Text style={styles.doctorDiseaseNumber}>
                      {doctor.disease_counts.pterygium}
                    </Text>

                    <Text style={styles.doctorDiseaseLabel}>Pterygium</Text>
                  </View>

                  <View style={styles.doctorDiseaseItem}>
                    <Text style={styles.doctorDiseaseNumber}>
                      {doctor.disease_counts.strabismus}
                    </Text>

                    <Text style={styles.doctorDiseaseLabel}>Strabismus</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingScreenText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  adminHeaderSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },

  logoutIconButton: {
    position: "absolute",
    top: 18,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    zIndex: 10,
  },

  profilePhotoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },

  headerProfilePhoto: {
    width: "100%",
    height: "100%",
  },

  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  collectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
  },

  collectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  collectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  collectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },

  totalImagesBox: {
    minHeight: 80,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  totalImagesLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  totalImagesCount: {
    marginTop: 2,
    fontSize: 30,
    fontWeight: "800",
    color: "#2563EB",
  },

  personalDiseaseRow: {
    flexDirection: "row",
    gap: 8,
  },

  personalDiseaseItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
  },

  personalDiseaseCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },

  personalDiseaseLabel: {
    marginTop: 3,
    fontSize: 9,
    color: "#64748B",
    textAlign: "center",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },

  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },

  myImagesList: {
    gap: 12,
    marginBottom: 24,
  },

  myImageCard: {
    minHeight: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },

  imageThumbnail: {
    width: 92,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },

  imageThumbnailPlaceholder: {
    width: 92,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  myImageInfo: {
    flex: 1,
    marginLeft: 12,
  },

  myImageDisease: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    textTransform: "capitalize",
  },

  myImageSubtype: {
    marginTop: 4,
    fontSize: 13,
    color: "#475569",
  },

  myImageDetails: {
    marginTop: 7,
    fontSize: 11,
    color: "#64748B",
  },

  myImageDate: {
    marginTop: 3,
    fontSize: 10,
    color: "#94A3B8",
  },

  emptyImagesCard: {
    minHeight: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyImagesTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },

  emptyImagesText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
  },

  adminInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },

  adminInfoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  adminInfoName: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  adminInfoEmail: {
    marginTop: 3,
    fontSize: 13,
    color: "#2563EB",
  },

  adminStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },

  adminStatCard: {
    width: "48%",
    minHeight: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  adminStatNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563EB",
  },

  adminStatLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },

  doctorList: {
    gap: 12,
  },

  doctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  doctorIdentity: {
    flex: 1,
  },

  doctorProfilePhoto: {
    width: "100%",
    height: "100%",
  },

  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  doctorEmail: {
    marginTop: 3,
    fontSize: 12,
    color: "#2563EB",
  },

  doctorDetails: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 4,
  },

  doctorDetailText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },

  doctorTotalBox: {
    marginTop: 14,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  doctorTotalNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563EB",
  },

  doctorTotalLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748B",
  },

  doctorDiseaseRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  doctorDiseaseItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },

  doctorDiseaseNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },

  doctorDiseaseLabel: {
    marginTop: 3,
    fontSize: 8,
    color: "#64748B",
    textAlign: "center",
  },
});
