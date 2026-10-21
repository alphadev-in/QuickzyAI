import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useColorScheme';
import { useAuthStore } from '../../store/authStore';
import ReusableImagePicker from '../../components/ImagePicker';
import { userAPI } from '../../services/api';

const BUCKET_NAME = 'allshoplocaluk.appspot.com';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user, logout, updateUser } = useAuthStore();

  const handleImageSelected = async (uri: string) => {
    if (!uri || !user?.uid) return;

    try {
      const fileName = uri.split('/').pop() || `profile_${Date.now()}`;
      const contentType = 'image/jpeg';
      const res = await userAPI.getImageUploadUrl(user.uid, { fileName, contentType });
      const { url, filePath } = res.data;

      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      const photoURL = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;

      await userAPI.update(user.uid, { photoURL });

      if (user) {
        updateUser({ ...user, photoURL });
      }

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const menuItems = [
    { id: '1', title: 'Manage Addresses', icon: 'location', action: () => {} },
    { id: '2', title: 'Payment Methods', icon: 'card', action: () => {} },
    { id: '3', title: 'Favorites', icon: 'heart', action: () => {} },
    { id: '4', title: 'Help & Support', icon: 'help-circle', action: () => {} },
    { id: '5', title: 'Settings', icon: 'settings', action: () => {} },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ReusableImagePicker
            currentImage={user?.photoURL}
            onImageSelected={handleImageSelected}
          />
          <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.contact, { color: colors.textSecondary }]}>
            {user?.email || user?.phone}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.roleText, { color: colors.text }]}>
              {user?.role?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border },
              ]}
              onPress={item.action}
            >
              <Ionicons name={item.icon as any} size={24} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Quickzy v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 32,
  },
});
