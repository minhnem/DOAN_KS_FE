import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Đặt baseURL trỏ tới backend của bạn
// - Android emulator: http://10.0.2.2:3001
// - iOS simulator: http://localhost:3001
// - Thiết bị thật (iPhone/Android): http://<ip-lan>:3001
// 
// ⚠️ QUAN TRỌNG: Thay YOUR_IP bằng IP máy tính của bạn
// Mở CMD gõ "ipconfig" để xem IPv4 Address (VD: 192.168.1.100)
const API_BASE_URL = "http://192.168.1.184:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Gắn token vào header trước mỗi request
api.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// ==== Auth (dùng chung) ====
export const loginApi = (email: string, password: string, deviceId?: string) =>
  api.post("/auth/login", { email, password, deviceId });

export const registerApi = (data: { name: string; email: string; password: string; rule?: number }) =>
  api.post("/auth/register", data);

// Gửi mã xác minh email
export const sendVerificationCodeApi = (data: { 
  name: string; 
  email: string; 
  password: string; 
  rule?: number;
  studentId?: string;
}) => api.post("/auth/send-verification", data);

// Xác minh mã và hoàn tất đăng ký  
export const verifyCodeAndRegisterApi = (data: { email: string; code: string; deviceId?: string }) =>
  api.post("/auth/verify-register", data);

// ==== CLASS MANAGEMENT ====
// Giảng viên: Tạo lớp học mới
export const createClassApi = (data: {
  name: string;
  description?: string;
  maxStudents?: number;
}) => api.post("/class/create", data);

// Giảng viên: Lấy danh sách lớp đang dạy
export const getTeacherClasses = () => api.get("/class/teacher");

// Giảng viên: Lấy danh sách sinh viên trong lớp
export const getClassStudents = (classId: string) =>
  api.get(`/class/${classId}/students`);

// Giảng viên: Đóng lớp học
export const closeClass = (classId: string) =>
  api.put(`/class/${classId}/close`);

// Giảng viên: Cập nhật lớp học
export const updateClassApi = (
  classId: string,
  data: { name?: string; description?: string; maxStudents?: number; status?: string }
) => api.put(`/class/${classId}`, data);

// Giảng viên: Xóa lớp học
export const deleteClassApi = (classId: string) =>
  api.delete(`/class/${classId}`);

// Sinh viên: Lấy danh sách lớp đã tham gia
export const getStudentClasses = () => api.get("/class/student");

// Sinh viên: Tham gia lớp bằng mã code
export const joinClassByCodeApi = (code: string) =>
  api.post("/class/join", { code });

// Sinh viên: Thoát khỏi lớp học
export const leaveClassApi = (classId: string) =>
  api.delete(`/class/${classId}/leave`);

// Chung: Lấy thông tin chi tiết lớp
export const getClassDetail = (classId: string) =>
  api.get(`/class/${classId}`);

// ==== SESSION/ATTENDANCE MANAGEMENT ====
// Giảng viên: Lấy danh sách buổi điểm danh theo lớp
export const getSessionsByClassForTeacher = (classId: string) =>
  api.get(`/attendance/class/${classId}/sessions`);

// Giảng viên: Tạo buổi điểm danh mới
export const createSessionForTeacher = (payload: {
  courseId?: string;
  title?: string;
  startTime: string;
  endTime: string;
  attendanceWindowStart?: string;
  attendanceWindowEnd?: string;
  latitude: number;
  longitude: number;
  radius?: number;
}) => api.post("/attendance/sessions", payload);

// Giảng viên: Sinh mã QR cho buổi điểm danh
export const generateQrForSession = (sessionId: string, expiresInMinutes = 5) =>
  api.post(`/attendance/sessions/${sessionId}/qr`, { expiresInMinutes });

// Giảng viên: Lấy danh sách điểm danh theo buổi (chỉ SV đã điểm danh)
export const getAttendanceBySession = (sessionId: string) =>
  api.get(`/attendance/sessions/${sessionId}/attendances`);

// Giảng viên: Lấy danh sách tất cả SV với trạng thái điểm danh theo buổi
export const getSessionStudentsWithAttendance = (sessionId: string) =>
  api.get(`/attendance/sessions/${sessionId}/students`);

// Giảng viên: Thống kê điểm danh theo lớp
export const getClassAttendanceStats = (classId: string) =>
  api.get(`/attendance/class/${classId}/stats`);

// Giảng viên: Điểm danh thủ công cho sinh viên
export const manualCheckInApi = (data: {
  sessionId: string;
  studentId: string;
  status: "present" | "late" | "absent" | "absent_excused" | "absent_unexcused";
}) => api.post("/attendance/manual-check-in", data);

// Giảng viên: Lấy chi tiết buổi học
export const getSessionDetail = (sessionId: string) =>
  api.get(`/attendance/sessions/${sessionId}`);

// Giảng viên: Cập nhật buổi học
export const updateSessionApi = (
  sessionId: string,
  data: {
    title?: string;
    startTime?: string;
    endTime?: string;
    attendanceWindowStart?: string;
    attendanceWindowEnd?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    status?: string;
  }
) => api.put(`/attendance/sessions/${sessionId}`, data);

// Giảng viên: Xóa buổi học
export const deleteSessionApi = (sessionId: string) =>
  api.delete(`/attendance/sessions/${sessionId}`);

// Sinh viên: Lấy danh sách buổi điểm danh theo lớp
export const getSessionsByClass = (classId: string) =>
  api.get(`/attendance/class/${classId}/sessions`);

// Sinh viên: Check-in điểm danh
export const checkInAttendanceApi = (payload: {
  sessionId: string;
  token: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}) => api.post("/attendance/check-in", payload);

// Sinh viên: Lấy lịch sử điểm danh
export const getAttendanceHistory = () => api.get("/attendance/history");

// Sinh viên: Lấy danh sách buổi học với trạng thái điểm danh
export const getStudentSessionsWithAttendance = (classId: string) =>
  api.get(`/attendance/student/class/${classId}/sessions`);

// ==== PROFILE/ACCOUNT MANAGEMENT ====
// Lấy thông tin profile
export const getProfileApi = () => api.get("/auth/profile");

// Cập nhật thông tin profile
export const updateProfileApi = (data: { name?: string; photoUrl?: string }) =>
  api.put("/auth/profile", data);

// Đổi mật khẩu
export const changePasswordApi = (data: { currentPassword: string; newPassword: string }) =>
  api.put("/auth/change-password", data);

// ==== DEVICE MANAGEMENT ====
// Sinh viên: Gửi yêu cầu đổi thiết bị
export const createDeviceRequestApi = (data: {
  studentId: string;
  oldDeviceId?: string;
  newDeviceId: string;
}) => api.post("/device/request", data);

// Sinh viên: Kiểm tra trạng thái yêu cầu
export const checkDeviceRequestStatusApi = (studentId: string) =>
  api.get(`/device/request/status/${studentId}`);

// Giảng viên: Lấy danh sách yêu cầu đổi thiết bị
export const getDeviceRequestsApi = (status?: "pending" | "approved" | "rejected") =>
  api.get("/device/requests", { params: status ? { status } : {} });

// Giảng viên: Đếm số yêu cầu pending
export const countPendingDeviceRequestsApi = () =>
  api.get("/device/requests/count");

// Giảng viên: Phê duyệt yêu cầu
export const approveDeviceRequestApi = (requestId: string) =>
  api.put(`/device/requests/${requestId}/approve`);

// Giảng viên: Từ chối yêu cầu
export const rejectDeviceRequestApi = (requestId: string, reason?: string) =>
  api.put(`/device/requests/${requestId}/reject`, { reason });
