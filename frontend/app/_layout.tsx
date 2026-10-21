
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const loadUser = useAuthStore(state => state.loadUser);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/phone" />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/role" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(restaurant)" />
        <Stack.Screen name="(delivery)" />
        <Stack.Screen name="(restaurant)/add-restaurant" />
        <Stack.Screen name="(restaurant)/menu/add-item" />
        <Stack.Screen name="(restaurant)/menu/[restaurantId]" />
      </Stack>
    </>
  );
}
