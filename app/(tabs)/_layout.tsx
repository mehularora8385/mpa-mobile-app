import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { mockAuthService } from "@/lib/auth-mock";
import LoginScreen from "./index";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { Stack } from "expo-router";

export default function TabLayout() {
  const colors = useColors();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    // Refresh session every 500ms to detect login changes
    const interval = setInterval(checkSession, 500);
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const currentSession = await mockAuthService.getSession();
      console.log('Session check result:', currentSession);
      setSession(currentSession);
      setLoading(false);
    } catch (err) {
      console.error('Error checking session:', err);
      setSession(null);
      setLoading(false);
    }
  };

  // Show login screen if no session
  if (!session) {
    return <LoginScreen />;
  }

  return (
    <View className="flex-1 flex-row bg-background">
      {/* Sidebar Navigation */}
      <SidebarNavigation />
      
      {/* Content Area */}
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </View>
  );
}
