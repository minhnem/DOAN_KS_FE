import React, { useState } from "react";
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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { createClassApi } from "../api/client";

type Props = NativeStackScreenProps<any>;

interface CreatedClass {
  _id: string;
  code: string;
  name: string;
  description?: string;
}

const CreateClassScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdClass, setCreatedClass] = useState<CreatedClass | null>(null);

  const onCreateClass = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên lớp học.");
      return;
    }

    try {
      setLoading(true);
      const res = await createClassApi({
        name: name.trim(),
        description: description.trim() || undefined,
        maxStudents: maxStudents ? parseInt(maxStudents, 10) : undefined,
      });

      const newClass = res.data?.data;
      setCreatedClass(newClass);

      Alert.alert("Thành công", `Tạo lớp "${newClass.name}" thành công!\nMã lớp: ${newClass.code}`);
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? error.message);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setCreatedClass(null);
    setName("");
    setDescription("");
    setMaxStudents("");
  };

  // Hiển thị kết quả sau khi tạo lớp thành công
  if (createdClass) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Tạo lớp thành công!</Text>

          <View style={styles.classInfo}>
            <Text style={styles.className}>{createdClass.name}</Text>
            {createdClass.description && (
              <Text style={styles.classDesc}>{createdClass.description}</Text>
            )}
          </View>

          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Mã lớp học</Text>
            <Text style={styles.codeValue}>{createdClass.code}</Text>
          </View>

          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>QR Code để tham gia</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={JSON.stringify({
                  type: "join_class",
                  code: createdClass.code,
                })}
                size={180}
              />
            </View>
            <Text style={styles.qrHint}>
              Sinh viên quét mã này để tham gia lớp
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onReset}
            >
              <Text style={styles.secondaryButtonText}>Tạo lớp khác</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Tạo lớp học mới</Text>
          <Text style={styles.subtitle}>
            Điền thông tin để tạo lớp học và nhận mã để sinh viên tham gia
          </Text>

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
              placeholder="Mô tả về lớp học (không bắt buộc)"
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

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={onCreateClass}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Đang tạo..." : "Tạo lớp học"}
            </Text>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
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
  submitButton: {
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Result screen styles
  resultContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2ecc71",
    marginBottom: 16,
  },
  classInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  className: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  classDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  codeSection: {
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4361ee",
    letterSpacing: 4,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  qrHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4361ee",
  },
  secondaryButtonText: {
    color: "#4361ee",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default CreateClassScreen;

