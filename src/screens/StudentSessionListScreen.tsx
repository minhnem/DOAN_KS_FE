import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getSessionsByClass } from "../api/client";

type Props = NativeStackScreenProps<any>;

interface SessionItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "ongoing" | "closed";
}

const StudentSessionListScreen: React.FC<Props> = ({ route, navigation }) => {
  const classId = route?.params?.classId as string | undefined;
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  if (!classId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin lớp.</Text>
      </View>
    );
  }

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getSessionsByClass(classId);
      setSessions(res.data?.data ?? []);
    } catch (error) {
      // TODO: Alert
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ongoing":
        return { text: "Đang mở", color: "#2ecc71", bgColor: "#d4edda" };
      case "scheduled":
        return { text: "Sắp diễn ra", color: "#f39c12", bgColor: "#fff3cd" };
      case "closed":
        return { text: "Đã kết thúc", color: "#95a5a6", bgColor: "#e9ecef" };
      default:
        return { text: status, color: "#666", bgColor: "#f0f0f0" };
    }
  };

  const renderItem = ({ item }: { item: SessionItem }) => {
    const statusInfo = getStatusDisplay(item.status);
    const isOngoing = item.status === "ongoing";

    return (
      <TouchableOpacity
        style={[styles.item, isOngoing && styles.itemOngoing]}
        disabled={!isOngoing}
        onPress={() =>
          navigation.navigate("QRScanner", {
            sessionId: item._id,
          })
        }
      >
        <View style={styles.itemHeader}>
          <Text style={styles.title}>{item.title || "Buổi học"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <Text style={styles.time}>
          🕐 {new Date(item.startTime).toLocaleString("vi-VN")}
        </Text>
        <Text style={styles.timeEnd}>
          → {new Date(item.endTime).toLocaleTimeString("vi-VN")}
        </Text>

        {isOngoing && (
          <View style={styles.scanPrompt}>
            <Text style={styles.scanPromptText}>👆 Bấm để quét QR điểm danh</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải buổi học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Chưa có buổi học nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  item: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemOngoing: {
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  time: {
    fontSize: 14,
    color: "#555",
  },
  timeEnd: {
    fontSize: 13,
    color: "#888",
    marginLeft: 20,
  },
  scanPrompt: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  scanPromptText: {
    textAlign: "center",
    color: "#2ecc71",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
});

export default StudentSessionListScreen;

