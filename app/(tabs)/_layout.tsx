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

  useEffect(() => {
    console.log('TabLayout mounted - checking session');
    checkSession();
    
    // Refresh session every 200ms to detect login changes quickly
    const interval = setInterval(checkSession, 200);
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const currentSession = await mockAuthService.getSession();
      console.log('SESSION CHECK:', {
        hasSession: !!currentSession,
        sessionData: currentSession,
        isNull: currentSession === null,
        isUndefined: currentSession === undefined,
      });
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
      console.log('Storage event detected - rechecking session');
      checkSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // CRITICAL: Show login form if no session
  // This should completely hide the sidebar
  if (!session) {
    console.log('RENDERING: LOGIN FORM ONLY (NO SIDEBAR)');
    return <LoginForm />;
  }

  // Show authenticated app with sidebar
  console.log('RENDERING: AUTHENTICATED APP WITH SIDEBAR');
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
