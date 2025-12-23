import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

import LoginScreen from "../screens/LoginScreen";
import TeacherClassListScreen from "../screens/TeacherClassListScreen";
import TeacherSessionListScreen from "../screens/TeacherSessionListScreen";
import TeacherQrScreen from "../screens/TeacherQrScreen";
import TeacherAttendanceListScreen from "../screens/TeacherAttendanceListScreen";

export type RootStackParamList = {
  Login: undefined;
  TeacherClasses: undefined;
  TeacherSessions: { classId: string };
  TeacherQR: { sessionId: string };
  TeacherAttendance: { sessionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      setIsLoggedIn(!!token);
      setIsCheckingAuth(false);
    };
    checkToken();
  }, []);

  if (isCheckingAuth) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isLoggedIn ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Đăng nhập" }}
          />
        ) : (
          <>
            <Stack.Screen
              name="TeacherClasses"
              component={TeacherClassListScreen}
              options={{ title: "Lớp đang dạy" }}
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
              options={{ title: "SV đã điểm danh" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;


