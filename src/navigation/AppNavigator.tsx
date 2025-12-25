import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

// Auth
import LoginScreen from "../screens/LoginScreen";

// Teacher Screens
import TeacherClassListScreen from "../screens/TeacherClassListScreen";
import TeacherSessionListScreen from "../screens/TeacherSessionListScreen";
import TeacherQrScreen from "../screens/TeacherQrScreen";
import TeacherAttendanceListScreen from "../screens/TeacherAttendanceListScreen";
import TeacherClassStatsScreen from "../screens/TeacherClassStatsScreen";
import CreateClassScreen from "../screens/CreateClassScreen";
import EditClassScreen from "../screens/EditClassScreen";
import EditSessionScreen from "../screens/EditSessionScreen";

// Student Screens
import StudentClassListScreen from "../screens/StudentClassListScreen";
import StudentSessionListScreen from "../screens/StudentSessionListScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import AttendanceHistoryScreen from "../screens/AttendanceHistoryScreen";
import JoinClassScreen from "../screens/JoinClassScreen";

export type RootStackParamList = {
  // Auth
  Login: undefined;

  // Teacher
  TeacherClasses: undefined;
  TeacherSessions: { classId: string };
  TeacherQR: { sessionId: string };
  TeacherAttendance: { sessionId: string };
  TeacherClassStats: { classId: string };
  CreateClass: undefined;
  EditClass: { classId: string };
  EditSession: { sessionId: string };

  // Student
  StudentClasses: undefined;
  StudentSessions: { classId: string };
  QRScanner: { sessionId: string };
  AttendanceHistory: undefined;
  JoinClass: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7fa",
        }}
      >
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#4361ee",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        {!isLoggedIn ? (
          // Auth Stack
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : userRole === 2 ? (
          // Teacher Stack
          <>
            <Stack.Screen
              name="TeacherClasses"
              component={TeacherClassListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateClass"
              component={CreateClassScreen}
              options={{ title: "Tạo lớp học" }}
            />
            <Stack.Screen
              name="TeacherSessions"
              component={TeacherSessionListScreen}
              options={{ title: "Buổi điểm danh" }}
            />
            <Stack.Screen
              name="TeacherQR"
              component={TeacherQrScreen}
              options={{ title: "QR điểm danh" }}
            />
            <Stack.Screen
              name="TeacherAttendance"
              component={TeacherAttendanceListScreen}
              options={{ title: "Điểm danh" }}
            />
            <Stack.Screen
              name="TeacherClassStats"
              component={TeacherClassStatsScreen}
              options={{ title: "Thống kê lớp học" }}
            />
            <Stack.Screen
              name="EditClass"
              component={EditClassScreen}
              options={{ title: "Sửa lớp học" }}
            />
            <Stack.Screen
              name="EditSession"
              component={EditSessionScreen}
              options={{ title: "Sửa buổi học" }}
            />
          </>
        ) : (
          // Student Stack (default)
          <>
            <Stack.Screen
              name="StudentClasses"
              component={StudentClassListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="JoinClass"
              component={JoinClassScreen}
              options={{ title: "Tham gia lớp" }}
            />
            <Stack.Screen
              name="StudentSessions"
              component={StudentSessionListScreen}
              options={{ title: "Buổi học" }}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{ title: "Quét QR điểm danh" }}
            />
            <Stack.Screen
              name="AttendanceHistory"
              component={AttendanceHistoryScreen}
              options={{ title: "Lịch sử điểm danh" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
