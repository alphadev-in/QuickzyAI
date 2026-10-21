import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeColor } from '../hooks/useColorScheme';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const colors = useThemeColor();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Navigate to appropriate dashboard based on role
        switch (user.role) {
          case 'customer':
            router.replace('/(customer)/home');
            break;
          case 'restaurant':
            router.replace('/(restaurant)/dashboard');
            break;
          case 'delivery':
            router.replace('/(delivery)/dashboard');
            break;
          default:
            router.replace('/auth/login');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.logo, { color: colors.text }]}>Quickzy</Text>
      <ActivityIndicator size="large" color={colors.text} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
});