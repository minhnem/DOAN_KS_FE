import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getSessionDetail, updateSessionApi, deleteSessionApi } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "EditSession">;

const EditSessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"scheduled" | "ongoing" | "closed">("scheduled");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionDetail();
  }, []);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      const res = await getSessionDetail(sessionId);
      const data = res.data?.data;
      if (data) {
        setTitle(data.title || "");
        setStatus(data.status || "scheduled");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Tiêu đề không được để trống");
      return;
    }

    try {
      setSaving(true);
      await updateSessionApi(sessionId, {
        title: title.trim(),
        status,
      });
      Alert.alert("Thành công", "Cập nhật buổi học thành công", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa buổi học này? Tất cả điểm danh sẽ bị xóa vĩnh viễn!",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await deleteSessionApi(sessionId);
              Alert.alert("Thành công", "Đã xóa buổi học", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert("Lỗi", error.response?.data?.message ?? "Xóa thất bại");
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Chỉnh sửa buổi học</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề buổi học *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Buổi 1 - Giới thiệu môn học"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "scheduled" && styles.statusButtonScheduled,
                ]}
                onPress={() => setStatus("scheduled")}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "scheduled" && styles.statusButtonTextActive,
                  ]}
                >
                  Sắp diễn ra
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "ongoing" && styles.statusButtonOngoing,
                ]}
                onPress={() => setStatus("ongoing")}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "ongoing" && styles.statusButtonTextActive,
                  ]}
                >
                  Đang mở
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "closed" && styles.statusButtonClosed,
                ]}
                onPress={() => setStatus("closed")}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "closed" && styles.statusButtonTextActive,
                  ]}
                >
                  Đã kết thúc
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, saving && styles.disabledButton]}
            onPress={handleDelete}
            disabled={saving}
          >
            <Text style={styles.deleteButtonText}>🗑️ Xóa buổi học</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  statusButtonScheduled: {
    borderColor: "#f39c12",
    backgroundColor: "#fff3cd",
  },
  statusButtonOngoing: {
    borderColor: "#27ae60",
    backgroundColor: "#d4edda",
  },
  statusButtonClosed: {
    borderColor: "#95a5a6",
    backgroundColor: "#e9ecef",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  statusButtonTextActive: {
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#e74c3c",
  },
  deleteButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default EditSessionScreen;

