import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { 
  loginApi, 
  sendVerificationCodeApi, 
  verifyCodeAndRegisterApi,
  createDeviceRequestApi,
  checkDeviceRequestStatusApi,
} from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<any>;

type AuthMode = "login" | "register";
type RegisterStep = "form" | "verify";
type UserRole = 1 | 2;

const COUNTDOWN_SECONDS = 60;

// Lấy Device ID duy nhất cho thiết bị
const getDeviceId = async (): Promise<string> => {
  try {
    if (Platform.OS === "android") {
      const androidId = Application.getAndroidId();
      return androidId || `android-${Device.modelName}-${Date.now()}`;
    } else if (Platform.OS === "ios") {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId || `ios-${Device.modelName}-${Date.now()}`;
    }
    return `device-${Device.modelName}-${Date.now()}`;
  } catch {
    return `device-${Date.now()}`;
  }
};

const LoginScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<RegisterStep>("form");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(1);
  const [code, setCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeInputRef = useRef<TextInput>(null);

  // Device change states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceChangeInfo, setDeviceChangeInfo] = useState<{
    studentId: string;
    studentName: string;
    studentCode: string;
    oldDeviceId: string;
    newDeviceId: string;
    pendingApproval: boolean;
  } | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [countdown]);

  // Focus code input when entering verify step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  const resetAll = () => {
    setName("");
    setEmail("");
    setPassword("");
    setStudentId("");
    setSelectedRole(1);
    setCode("");
    setStep("form");
    setCountdown(0);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      setLoading(true);
      
      // Lấy Device ID
      const deviceId = await getDeviceId();
      
      const res = await loginApi(email.trim(), password, deviceId);
      const data = res.data?.data;
      if (!data?.token) throw new Error("Không nhận được token.");
      await login(data.token, data.rule ?? 1, {
        _id: data._id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        rule: data.rule ?? 1,
      });
    } catch (err: any) {
      const responseData = err.response?.data;
      
      // Kiểm tra xem có phải lỗi đổi thiết bị không
      if (responseData?.requireDeviceChange) {
        if (responseData.pendingApproval) {
          // Đang chờ duyệt
          Alert.alert(
            "⏳ Đang chờ phê duyệt",
            "Yêu cầu đổi thiết bị của bạn đang được giáo viên xem xét. Vui lòng đợi hoặc liên hệ giáo viên.",
            [{ text: "Đã hiểu" }]
          );
        } else {
          // Cần gửi yêu cầu đổi thiết bị
          const deviceId = await getDeviceId();
          setDeviceChangeInfo({
            studentId: responseData.studentId,
            studentName: responseData.studentName,
            studentCode: responseData.studentCode,
            oldDeviceId: responseData.oldDeviceId,
            newDeviceId: deviceId,
            pendingApproval: false,
          });
          setShowDeviceModal(true);
        }
      } else {
        Alert.alert("Lỗi", responseData?.message ?? err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendDeviceRequest = async () => {
    if (!deviceChangeInfo) return;
    
    try {
      setSendingRequest(true);
      await createDeviceRequestApi({
        studentId: deviceChangeInfo.studentId,
        oldDeviceId: deviceChangeInfo.oldDeviceId,
        newDeviceId: deviceChangeInfo.newDeviceId,
      });
      
      setShowDeviceModal(false);
      Alert.alert(
        "✅ Yêu cầu đã được gửi",
        "Yêu cầu đổi thiết bị đã được gửi đến giáo viên. Vui lòng chờ phê duyệt trước khi đăng nhập lại.",
        [{ text: "Đã hiểu" }]
      );
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message ?? "Không thể gửi yêu cầu");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleSendCode = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    // Sinh viên phải có mã sinh viên
    if (selectedRole === 1 && !studentId.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã sinh viên.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    try {
      setLoading(true);
      await sendVerificationCodeApi({
        name: name.trim(),
        email: email.trim(),
        password,
        rule: selectedRole,
        studentId: selectedRole === 1 ? studentId.trim() : undefined,
      });
      setStep("verify");
      setCountdown(COUNTDOWN_SECONDS);
      Alert.alert("Thành công", "Mã xác minh đã được gửi đến email của bạn.");
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    try {
      setLoading(true);
      await sendVerificationCodeApi({
        name: name.trim(),
        email: email.trim(),
        password,
        rule: selectedRole,
        studentId: selectedRole === 1 ? studentId.trim() : undefined,
      });
      setCode("");
      setCountdown(COUNTDOWN_SECONDS);
      Alert.alert("Thành công", "Mã xác minh mới đã được gửi.");
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    try {
      setLoading(true);
      
      // Lấy Device ID cho sinh viên
      const deviceId = selectedRole === 1 ? await getDeviceId() : undefined;
      
      const res = await verifyCodeAndRegisterApi({ 
        email: email.trim(), 
        code,
        deviceId,
      });
      const data = res.data?.data;
      if (!data?.token) throw new Error("Không nhận được token.");
      await login(data.token, data.rule ?? selectedRole, {
        _id: data._id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        rule: data.rule ?? selectedRole,
      });
      Alert.alert("Thành công", "Đăng ký thành công!");
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== VERIFY STEP UI =====
  if (mode === "register" && step === "verify") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.card}>
            <Text style={styles.verifyIcon}>📧</Text>
            <Text style={styles.verifyTitle}>Xác minh Email</Text>
            <Text style={styles.verifySubtitle}>Mã đã gửi đến</Text>
            <Text style={styles.verifyEmail}>{email}</Text>

            {/* Timer */}
            <View style={styles.timerBox}>
              {countdown > 0 ? (
                <>
                  <Text style={styles.timerLabel}>Mã có hiệu lực trong</Text>
                  <Text style={styles.timerValue}>
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                  </Text>
                </>
              ) : (
                <Text style={styles.timerExpired}>⏰ Mã đã hết hạn</Text>
              )}
            </View>

            {/* Code Input */}
            <TextInput
              ref={codeInputRef}
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor="#ccc"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
            />

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.button, (loading || countdown === 0) && styles.buttonDisabled]}
              disabled={loading || countdown === 0}
              onPress={handleVerify}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Xác minh & Đăng ký</Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <TouchableOpacity
              style={styles.resendBtn}
              disabled={countdown > 0 || loading}
              onPress={handleResendCode}
            >
              <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : "📩 Gửi lại mã"}
              </Text>
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => { setStep("form"); setCode(""); }}>
              <Text style={styles.backText}>← Quay lại</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ===== LOGIN / REGISTER FORM =====
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>ĐIỂM DANH</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.activeTab]}
              onPress={() => { setMode("login"); resetAll(); }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.activeTabText]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.activeTab]}
              onPress={() => { setMode("register"); resetAll(); }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.activeTabText]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {/* Mã sinh viên - chỉ hiển thị cho sinh viên khi đăng ký */}
          {mode === "register" && selectedRole === 1 && (
            <TextInput
              style={styles.input}
              placeholder="Mã sinh viên"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              value={studentId}
              onChangeText={setStudentId}
            />
          )}
          {mode === "register" && (
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Role Selector */}
          {mode === "register" && (
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Bạn là:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, selectedRole === 1 && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(1)}
                >
                  <Text style={styles.roleIcon}>🎓</Text>
                  <Text style={[styles.roleText, selectedRole === 1 && styles.roleTextActive]}>Sinh viên</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, selectedRole === 2 && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(2)}
                >
                  <Text style={styles.roleIcon}>👨‍🏫</Text>
                  <Text style={[styles.roleText, selectedRole === 2 && styles.roleTextActive]}>Giảng viên</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={mode === "login" ? handleLogin : handleSendCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Đăng nhập" : "Gửi mã xác minh"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch mode */}
          <TouchableOpacity style={styles.switchMode} onPress={() => { setMode(mode === "login" ? "register" : "login"); resetAll(); }}>
            <Text style={styles.switchModeText}>
              {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Device Change Modal */}
      <Modal
        visible={showDeviceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeviceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>📱</Text>
            <Text style={styles.modalTitle}>Đổi thiết bị</Text>
            <Text style={styles.modalMessage}>
              Tài khoản này đã được đăng ký trên thiết bị khác.{"\n\n"}
              Nếu bạn muốn sử dụng thiết bị này, vui lòng gửi yêu cầu đổi thiết bị đến giáo viên.
            </Text>

            {deviceChangeInfo && (
              <View style={styles.deviceInfoBox}>
                <Text style={styles.deviceInfoText}>
                  👤 {deviceChangeInfo.studentName}
                </Text>
                <Text style={styles.deviceInfoText}>
                  🆔 MSV: {deviceChangeInfo.studentCode}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeviceModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendButton, sendingRequest && styles.buttonDisabled]}
                onPress={handleSendDeviceRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSendText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4361ee" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
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
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logo: { fontSize: 22, fontWeight: "800", color: "#4361ee", letterSpacing: 2 },
  tabContainer: { flexDirection: "row", backgroundColor: "#f0f4ff", borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#4361ee" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#666" },
  activeTabText: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#000",
  },
  roleSection: { marginBottom: 16 },
  roleLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 },
  roleButtons: { flexDirection: "row", gap: 12 },
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
  roleButtonActive: { borderColor: "#4361ee", backgroundColor: "#f0f4ff" },
  roleIcon: { fontSize: 20, marginRight: 8 },
  roleText: { fontSize: 14, fontWeight: "600", color: "#666" },
  roleTextActive: { color: "#4361ee" },
  button: { backgroundColor: "#4361ee", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchMode: { marginTop: 20, alignItems: "center" },
  switchModeText: { color: "#4361ee", fontSize: 14, fontWeight: "500" },
  // Verify step
  verifyIcon: { fontSize: 56, textAlign: "center", marginBottom: 12 },
  verifyTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", color: "#1a1a2e" },
  verifySubtitle: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 8 },
  verifyEmail: { fontSize: 16, fontWeight: "600", color: "#4361ee", textAlign: "center", marginTop: 4 },
  timerBox: { backgroundColor: "#f0f4ff", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginVertical: 20 },
  timerLabel: { fontSize: 14, color: "#666" },
  timerValue: { fontSize: 32, fontWeight: "800", color: "#4361ee", marginTop: 4 },
  timerExpired: { fontSize: 16, fontWeight: "600", color: "#e74c3c" },
  codeInput: {
    borderWidth: 2,
    borderColor: "#4361ee",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 12,
    backgroundColor: "#fff",
    color: "#1a1a2e",
    marginBottom: 16,
  },
  resendBtn: { paddingVertical: 12, alignItems: "center" },
  resendText: { color: "#4361ee", fontSize: 15, fontWeight: "600" },
  resendTextDisabled: { color: "#aaa" },
  backBtn: { paddingVertical: 12, alignItems: "center" },
  backText: { color: "#888", fontSize: 14 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  deviceInfoBox: {
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: "100%",
  },
  deviceInfoText: {
    fontSize: 14,
    color: "#1a1a2e",
    marginBottom: 6,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4361ee",
    alignItems: "center",
  },
  modalSendText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});

export default LoginScreen;
