import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  createSessionForTeacher,
  generateQrForSession,
  getSessionsByClassForTeacher,
} from "../api/client";
import * as Location from "expo-location";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherSessions">;

interface SessionItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "ongoing" | "closed";
}

const TeacherSessionListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classId } = route.params;
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getSessionsByClassForTeacher(classId);
      setSessions(res.data?.data ?? []);
    } catch (error) {
      // TODO: alert
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Refresh khi quay lại màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchSessions();
    });
    return unsubscribe;
  }, [navigation]);

  const onCreateSession = async () => {
    try {
      if (!title.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tiêu đề buổi học");
        return;
      }

      setCreating(true);

      // Xin quyền và lấy vị trí thực
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền vị trí để tạo buổi điểm danh");
        setCreating(false);
        return;
      }

      // Lấy vị trí GPS
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      
      console.log("📍 Vị trí tạo buổi học:", { latitude, longitude });

      // Kiểm tra vị trí hợp lệ
      if (latitude === 0 && longitude === 0) {
        Alert.alert("Lỗi", "Không thể lấy vị trí GPS. Vui lòng bật GPS và thử lại.");
        setCreating(false);
        return;
      }

      if (!latitude || !longitude) {
        Alert.alert("Lỗi", "Vị trí GPS không hợp lệ. Vui lòng thử lại.");
        setCreating(false);
        return;
      }

      // Tạo buổi trong 2 giờ, cho phép điểm danh 15 phút đầu
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const attendanceWindowEnd = new Date(
        now.getTime() + 15 * 60 * 1000
      ).toISOString();

      const response = await createSessionForTeacher({
        courseId: classId,
        title,
        startTime,
        endTime,
        attendanceWindowStart: startTime,
        attendanceWindowEnd,
        latitude,
        longitude,
        radius: 100, // Bán kính 100m
      });

      console.log("✅ Session đã tạo:", response.data?.data);

      setTitle("");
      fetchSessions();
      Alert.alert(
        "✅ Tạo buổi thành công!", 
        `📍 Vị trí lớp học:\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n📏 Bán kính điểm danh: 100m\n⏱️ Thời gian điểm danh: 15 phút đầu\n\n💡 Sinh viên cần ở trong phạm vi 100m để điểm danh "Có mặt"`
      );
    } catch (error: any) {
      Alert.alert("Lỗi tạo buổi", error.response?.data?.message ?? error.message);
    } finally {
      setCreating(false);
    }
  };

  const onOpenQR = async (sessionId: string) => {
    try {
      await generateQrForSession(sessionId, 5);
      navigation.navigate("TeacherQR", { sessionId });
    } catch (error: any) {
      Alert.alert("Lỗi tạo QR", error.response?.data?.message ?? error.message);
    }
  };

  const renderItem = ({ item }: { item: SessionItem }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <TouchableOpacity
          style={styles.editIconButton}
          onPress={() => navigation.navigate("EditSession", { sessionId: item._id })}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timeText}>
        {new Date(item.startTime).toLocaleString()} -{" "}
        {new Date(item.endTime).toLocaleTimeString()}
      </Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Trạng thái:</Text>
        <View style={[
          styles.statusBadge,
          item.status === "ongoing" ? styles.ongoingBadge :
          item.status === "closed" ? styles.closedBadge : styles.scheduledBadge
        ]}>
          <Text style={styles.statusBadgeText}>
            {item.status === "ongoing" ? "Đang mở" :
             item.status === "closed" ? "Đã kết thúc" : "Sắp diễn ra"}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onOpenQR(item._id)}
        >
          <Text style={styles.buttonText}>📱 Mở QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => navigation.navigate("TeacherAttendance", { sessionId: item._id })}
        >
          <Text style={styles.buttonText}>📋 Điểm danh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tạo buổi điểm danh</Text>
      <TextInput
        style={styles.input}
        placeholder="Tiêu đề buổi học"
        value={title}
        onChangeText={setTitle}
        editable={!creating}
      />
      <TouchableOpacity
        style={[styles.createButton, creating && styles.createButtonDisabled]}
        onPress={onCreateSession}
        disabled={creating}
      >
        {creating ? (
          <View style={styles.createButtonContent}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.createButtonText}>Đang lấy vị trí...</Text>
          </View>
        ) : (
          <Text style={styles.createButtonText}>📍 Tạo buổi tại vị trí hiện tại</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Danh sách buổi</Text>
      {loading ? (
        <Text>Đang tải...</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text>Chưa có buổi nào.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fa" },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8, color: "#1a1a2e" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  createButton: {
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  item: {
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontWeight: "700", fontSize: 16, color: "#1a1a2e", flex: 1 },
  editIconButton: {
    padding: 6,
    marginLeft: 8,
  },
  editIcon: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 13,
    color: "#888",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ongoingBadge: {
    backgroundColor: "#d4edda",
  },
  closedBadge: {
    backgroundColor: "#e9ecef",
  },
  scheduledBadge: {
    backgroundColor: "#fff3cd",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  row: { flexDirection: "row", marginTop: 4, gap: 10 },
  button: {
    flex: 1,
    backgroundColor: "#4361ee",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondary: { backgroundColor: "#9b59b6" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});

export default TeacherSessionListScreen;


