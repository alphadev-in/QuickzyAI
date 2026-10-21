
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useColorScheme';
import { useAuthStore } from '../../store/authStore';
import { userAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '../../utils/errorHandler';

const roles = [
  { id: 'customer', title: 'Customer', description: 'Order food from your favorite local restaurants', icon: 'person-outline' },
  { id: 'restaurant', title: 'Restaurant Partner', description: 'Manage your restaurant and reach more customers', icon: 'restaurant-outline' },
  { id: 'delivery', title: 'Delivery Partner', description: 'Deliver orders and earn money on your own schedule', icon: 'bicycle-outline' },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user, setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    if (user?.role) {
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
          setIsCheckingRole(false);
          break;
      }
    } else {
      setIsCheckingRole(false);
    }
  }, [user, router]);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Please select a role', 'You must choose a role to continue.');
      return;
    }

    setLoading(true);
    try {
      const name = await AsyncStorage.getItem('tempName');
      const uid = await AsyncStorage.getItem('tempUid');
      const email = await AsyncStorage.getItem('tempEmail'); // It's better to get email from a reliable source

      if (!uid || !name || !email) {
        Alert.alert('Session has expired', 'Please log in again to complete your registration.');
        await AsyncStorage.multiRemove(['tempName', 'tempUid', 'tempEmail']);
        router.replace('/auth/login');
        return;
      }

      const userData = {
        uid,
        email,
        name,
        role: selectedRole,
      };

      const response = await userAPI.create(userData);
      await setUser(response.data);
      await AsyncStorage.multiRemove(['tempName', 'tempUid', 'tempEmail']);

      switch (selectedRole) {
        case 'customer':
          router.replace('/(customer)/home');
          break;
        case 'restaurant':
          router.replace('/(restaurant)/dashboard');
          break;
        case 'delivery':
          router.replace('/(delivery)/dashboard');
          break;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error creating user:', errorMessage);
      Alert.alert('Error Creating Account', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingRole) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Choose Your Role</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This helps us personalize your experience. You can't change this later.
        </Text>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: selectedRole === role.id ? colors.primary : colors.border,
                  borderWidth: selectedRole === role.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <Ionicons
                name={role.icon as any}
                size={32}
                color={selectedRole === role.id ? colors.primary : colors.textSecondary}
              />
              <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleTitle, { color: colors.text }]}>{role.title}</Text>
                  <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (!selectedRole || loading) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
           {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  rolesContainer: { marginBottom: 32 },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 16 },
  roleTextContainer: { flex: 1, marginLeft: 16 },
  roleTitle: { fontSize: 18, fontWeight: '600' },
  roleDescription: { fontSize: 14, marginTop: 4 },
  button: { height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 18, fontWeight: '600' },
});
