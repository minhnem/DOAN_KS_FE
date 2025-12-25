import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { loginApi, registerApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<any>;

type AuthMode = "login" | "register";
type UserRole = 1 | 2; // 1 = Student, 2 = Teacher

const LoginScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(1);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setSelectedRole(1);
  };

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi(email.trim(), password);
      const data = res.data?.data;
      const token = data?.token;
      const role = data?.rule ?? 1;

      if (!token) throw new Error("Không nhận được token từ server.");

      // Tạo userData từ response
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        rule: role,
      };

      // Sử dụng context để login - sẽ tự động chuyển màn hình
      await login(token, role, userData);
    } catch (error: any) {
      Alert.alert("Lỗi đăng nhập", error.response?.data?.message ?? error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      const res = await registerApi({
        name: name.trim(),
        email: email.trim(),
        password,
        rule: selectedRole,
      });

      const data = res.data?.data;
      const token = data?.token;
      const role = data?.rule ?? selectedRole;

      if (!token) throw new Error("Không nhận được token từ server.");

      // Tạo userData từ response
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        rule: role,
      };

      // Sử dụng context để login - sẽ tự động chuyển màn hình
      await login(token, role, userData);
      
      Alert.alert("Thành công", "Đăng ký thành công!");
    } catch (error: any) {
      Alert.alert("Lỗi đăng ký", error.response?.data?.message ?? error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📍</Text>
            <Text style={styles.logo}>ATTEND</Text>
            <Text style={styles.subtitle}>Điểm danh QR + GPS</Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.activeTab]}
              onPress={() => {
                setMode("login");
                resetForm();
              }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.activeTabText]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.activeTab]}
              onPress={() => {
                setMode("register");
                resetForm();
              }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.activeTabText]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {mode === "register" && (
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Role Selector (only for register) */}
          {mode === "register" && (
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Bạn là:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 1 && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole(1)}
                >
                  <Text style={styles.roleIcon}>🎓</Text>
                  <Text
                    style={[
                      styles.roleText,
                      selectedRole === 1 && styles.roleTextActive,
                    ]}
                  >
                    Sinh viên
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 2 && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole(2)}
                >
                  <Text style={styles.roleIcon}>👨‍🏫</Text>
                  <Text
                    style={[
                      styles.roleText,
                      selectedRole === 2 && styles.roleTextActive,
                    ]}
                  >
                    Giảng viên
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            disabled={loading}
            onPress={mode === "login" ? onLogin : onRegister}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
            </Text>
          </TouchableOpacity>

          {/* Switch mode hint */}
          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => {
              setMode(mode === "login" ? "register" : "login");
              resetForm();
            }}
          >
            <Text style={styles.switchModeText}>
              {mode === "login"
                ? "Chưa có tài khoản? Đăng ký ngay"
                : "Đã có tài khoản? Đăng nhập"}
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
    backgroundColor: "#4361ee",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4361ee",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#4361ee",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  roleSection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  roleButtonActive: {
    borderColor: "#4361ee",
    backgroundColor: "#f0f4ff",
  },
  roleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  roleTextActive: {
    color: "#4361ee",
  },
  button: {
    backgroundColor: "#4361ee",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  switchMode: {
    marginTop: 20,
    alignItems: "center",
  },
  switchModeText: {
    color: "#4361ee",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default LoginScreen;
