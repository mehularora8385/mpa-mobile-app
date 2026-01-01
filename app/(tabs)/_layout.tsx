import { View } from "react-native";
import { useEffect, useState } from "react";
import React from "react";
import { mockAuthService } from "@/lib/auth-mock";
import { LoginForm } from "@/components/login-form";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { Stack } from "expo-router";

export default function TabLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    checkSession();
    // Refresh session every 300ms to detect login changes quickly
    const interval = setInterval(checkSession, 300);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

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

  // Listen for storage changes (for web)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, rechecking session...');
      checkSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Show login form if no session - NO SIDEBAR, NO TABS
  if (!session) {
    return <LoginForm />;
  }

  // Show authenticated app with sidebar
  return (
    <View className="flex-1 flex-row bg-background">
      {/* Sidebar Navigation - ONLY shown when logged in */}
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
