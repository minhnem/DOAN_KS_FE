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
import { getClassDetail, updateClassApi, deleteClassApi } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "EditClass">;

const EditClassScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classId } = route.params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassDetail();
  }, []);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const res = await getClassDetail(classId);
      const data = res.data?.data;
      if (data) {
        setName(data.name || "");
        setDescription(data.description || "");
        setMaxStudents(data.maxStudents ? String(data.maxStudents) : "");
        setStatus(data.status || "active");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải thông tin lớp học");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Tên lớp không được để trống");
      return;
    }

    try {
      setSaving(true);
      await updateClassApi(classId, {
        name: name.trim(),
        description: description.trim(),
        maxStudents: maxStudents ? parseInt(maxStudents, 10) : 0,
        status,
      });
      Alert.alert("Thành công", "Cập nhật lớp học thành công", [
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
      "Bạn có chắc muốn xóa lớp học này? Tất cả buổi học và điểm danh sẽ bị xóa vĩnh viễn!",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await deleteClassApi(classId);
              Alert.alert("Thành công", "Đã xóa lớp học", [
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
          <Text style={styles.title}>Chỉnh sửa lớp học</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên lớp học *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Lập trình Web - K65"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả về lớp học"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số sinh viên tối đa</Text>
            <TextInput
              style={styles.input}
              placeholder="Để trống nếu không giới hạn"
              value={maxStudents}
              onChangeText={setMaxStudents}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "active" && styles.statusButtonActive,
                ]}
                onPress={() => setStatus("active")}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "active" && styles.statusButtonTextActive,
                  ]}
                >
                  Hoạt động
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
                  Đã đóng
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
            <Text style={styles.deleteButtonText}>🗑️ Xóa lớp học</Text>
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 10,
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
  statusButtonActive: {
    borderColor: "#27ae60",
    backgroundColor: "#d4edda",
  },
  statusButtonClosed: {
    borderColor: "#e74c3c",
    backgroundColor: "#f8d7da",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  statusButtonTextActive: {
    color: "#155724",
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

export default EditClassScreen;

