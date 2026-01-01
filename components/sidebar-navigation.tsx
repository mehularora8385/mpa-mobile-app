import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

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
  const colors = useColors();

  return (
    <View className="w-56 bg-surface border-r border-border">
      <ScrollView className="flex-1">
        <View className="p-4 gap-2">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.route || pathname.includes(item.route.split('/').pop() || '');
            
            return (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                className={cn(
                  'p-4 rounded-lg border-2',
                  isActive
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                )}
              >
                <Text
                  className={cn(
                    'text-base font-semibold text-center',
                    isActive ? 'text-background' : 'text-foreground'
                  )}
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
