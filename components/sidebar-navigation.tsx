import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

interface SidebarItem {
  label: string;
  route: string;
  icon?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Home', route: '/(tabs)/home' },
  { label: 'Candidate Attendance', route: '/(tabs)/candidates' },
  { label: 'Candidate Verification', route: '/(tabs)/exam-day' },
  { label: 'Data Sync', route: '/(tabs)/sync' },
  { label: 'Data Download', route: '/(tabs)/download' },
  { label: 'Candidates', route: '/(tabs)/barcode-scanner' },
];

export function SidebarNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={{
      width: 224,
      backgroundColor: '#f5f5f5',
      borderRightWidth: 1,
      borderRightColor: '#E5E7EB',
      flexDirection: 'column',
    }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingVertical: 16, paddingHorizontal: 16, gap: 8 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.route || pathname.includes(item.route.split('/').pop() || '');
            
            return (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  backgroundColor: isActive ? '#0a7ea4' : '#ffffff',
                  borderColor: isActive ? '#0a7ea4' : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: isActive ? '#ffffff' : '#11181C',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
