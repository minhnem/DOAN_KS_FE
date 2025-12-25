import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { updateProfileApi, changePasswordApi, getProfileApi } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "AccountSettings">;

type SettingsTab = "profile" | "password";

const AccountSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile data (from API)
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    photoUrl: string;
    rule: number;
  } | null>(null);

  // Profile form
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Fetch latest profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfileApi();
        const data = res.data?.data;
        if (data) {
          setProfileData({
            name: data.name ?? "",
            email: data.email ?? "",
            photoUrl: data.photoUrl ?? "",
            rule: data.rule ?? 1,
          });
          setName(data.name ?? "");
          setPhotoUrl(data.photoUrl ?? "");
          // Update context with latest data
          await updateUser({
            name: data.name,
            email: data.email,
            photoUrl: data.photoUrl,
            rule: data.rule,
          });
        }
      } catch (error) {
        // Fallback to existing user data
        if (user) {
          setProfileData({
            name: user.name ?? "",
            email: user.email ?? "",
            photoUrl: user.photoUrl ?? "",
            rule: user.rule ?? 1,
          });
          setName(user.name ?? "");
          setPhotoUrl(user.photoUrl ?? "");
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateProfileApi({
        name: name.trim(),
        photoUrl: photoUrl.trim(),
      });

      const updatedData = res.data?.data;
      if (updatedData) {
        // Update local state
        setProfileData((prev) => prev ? {
          ...prev,
          name: updatedData.name,
          photoUrl: updatedData.photoUrl,
        } : null);
        
        // Update context
        await updateUser({
          name: updatedData.name,
          photoUrl: updatedData.photoUrl,
        });
      }

      Alert.alert("Thành công", "Cập nhật thông tin thành công.");
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp.");
      return;
    }

    setSavingPassword(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      Alert.alert("Thành công", "Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Use profileData if available, otherwise fallback to user
  const displayName = profileData?.name || user?.name || "";
  const displayEmail = profileData?.email || user?.email || "";
  const displayRule = profileData?.rule ?? user?.rule ?? 1;
  const isTeacher = displayRule === 2;
  const themeColor = isTeacher ? "#4361ee" : "#27ae60";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt tài khoản</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          {loadingProfile ? (
            <View style={styles.userCardLoading}>
              <ActivityIndicator size="small" color={themeColor} />
              <Text style={styles.userCardLoadingText}>Đang tải...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.avatar, { backgroundColor: themeColor }]}>
                <Text style={styles.avatarText}>
                  {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{displayName || "Đang tải..."}</Text>
                <Text style={styles.userEmail}>{displayEmail}</Text>
                <View style={[styles.roleBadge, { backgroundColor: themeColor + "20" }]}>
                  <Text style={[styles.roleText, { color: themeColor }]}>
                    {isTeacher ? "👨‍🏫 Giảng viên" : "🎓 Sinh viên"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && { backgroundColor: themeColor }]}
            onPress={() => setActiveTab("profile")}
          >
            <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
              Thông tin cá nhân
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "password" && { backgroundColor: themeColor }]}
            onPress={() => setActiveTab("password")}
          >
            <Text style={[styles.tabText, activeTab === "password" && styles.activeTabText]}>
              Đổi mật khẩu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.formCard}>
          {loadingProfile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColor} />
              <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
          ) : activeTab === "profile" ? (
            <>
              <Text style={styles.sectionTitle}>Cập nhật thông tin</Text>

              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ và tên"
              />

              <Text style={styles.label}>URL ảnh đại diện (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                value={photoUrl}
                onChangeText={setPhotoUrl}
                placeholder="https://example.com/avatar.jpg"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: themeColor }, savingProfile && styles.disabledButton]}
                onPress={handleUpdateProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>

              <Text style={styles.label}>Mật khẩu hiện tại *</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
              />

              <Text style={styles.label}>Mật khẩu mới *</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                secureTextEntry
              />

              <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: themeColor }, savingPassword && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>⏻ Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  userCardLoading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  userCardLoadingText: {
    marginLeft: 10,
    color: "#666",
    fontSize: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  userEmail: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 20,
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
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
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
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e74c3c",
  },
  logoutButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
});

export default AccountSettingsScreen;

