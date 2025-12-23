import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Đặt baseURL trỏ tới backend của bạn
// - Android emulator: http://10.0.2.2:5000
// - iOS simulator: http://localhost:5000
// - Thiết bị thật: http://<ip-lan>:5000
const API_BASE_URL = "http://localhost:3001";

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
export const loginApi = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// ==== Teacher APIs (backend cần bổ sung tương ứng) ====
export const getTeacherClasses = () => api.get("/teacher/classes");

export const getSessionsByClassForTeacher = (classId: string) =>
  api.get(`/teacher/classes/${classId}/sessions`);

export const createSessionForTeacher = (payload: {
  classId?: string;
  title?: string;
  startTime: string;
  endTime: string;
  attendanceWindowStart?: string;
  attendanceWindowEnd?: string;
  latitude: number;
  longitude: number;
  radius?: number;
}) => api.post("/attendance/sessions", payload);

export const generateQrForSession = (sessionId: string, expiresInMinutes = 5) =>
  api.post(`/attendance/sessions/${sessionId}/qr`, { expiresInMinutes });

export const getAttendanceBySession = (sessionId: string) =>
  api.get(`/teacher/sessions/${sessionId}/attendances`);

// ==== Student attendance history (phục vụ màn AttendanceHistoryScreen) ====
export const getAttendanceHistory = () => api.get("/student/attendance");

// ==== Student class list (phục vụ ClassListScreen cũ) ====
export const getStudentClasses = () => api.get("/student/classes");

// ==== Attendance check-in (sinh viên) ====
export const checkInAttendanceApi = (payload: {
  sessionId: string;
  token: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}) => api.post("/attendance/check-in", payload);

// ==== Student sessions by class (phục vụ SessionListScreen cũ) ====
export const getSessionsByClass = (classId: string) =>
  api.get(`/student/classes/${classId}/sessions`);


