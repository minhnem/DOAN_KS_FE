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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  createSessionForTeacher,
  generateQrForSession,
  getSessionsByClassForTeacher,
} from "../api/client";

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

  const onCreateSession = async () => {
    try {
      if (!title.trim()) {
        Alert.alert("Thiếu tiêu đề buổi học");
        return;
      }
      // Demo: tạo buổi trong 2 giờ, cho phép điểm danh 15 phút đầu
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const attendanceWindowEnd = new Date(
        now.getTime() + 15 * 60 * 1000
      ).toISOString();

      await createSessionForTeacher({
        classId,
        title,
        startTime,
        endTime,
        attendanceWindowStart: startTime,
        attendanceWindowEnd,
        latitude: 10.0, // TODO: thay bằng vị trí thật của lớp
        longitude: 106.0,
        radius: 50,
      });

      setTitle("");
      fetchSessions();
    } catch (error: any) {
      Alert.alert("Lỗi tạo buổi", error.response?.data?.message ?? error.message);
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
      <Text style={styles.title}>{item.title}</Text>
      <Text>
        {new Date(item.startTime).toLocaleString()} -{" "}
        {new Date(item.endTime).toLocaleTimeString()}
      </Text>
      <Text>Trạng thái: {item.status}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onOpenQR(item._id)}
        >
          <Text style={styles.buttonText}>Mở QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => navigation.navigate("TeacherAttendance", { sessionId: item._id })}
        >
          <Text style={styles.buttonText}>Danh sách điểm danh</Text>
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
      />
      <Button title="Tạo buổi" onPress={onCreateSession} />

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
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  item: {
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
  },
  title: { fontWeight: "bold", fontSize: 15 },
  row: { flexDirection: "row", marginTop: 8, gap: 8 },
  button: {
    flex: 1,
    backgroundColor: "#007aff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  secondary: { backgroundColor: "#5856d6" },
  buttonText: { color: "#fff", fontWeight: "600" },
});

export default TeacherSessionListScreen;


