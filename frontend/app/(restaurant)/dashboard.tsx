import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useColorScheme';
import { restaurantAPI, orderAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ReusableImagePicker from '../../components/ImagePicker';

const BUCKET_NAME = 'allshoplocaluk.appspot.com';

export default function RestaurantDashboard() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user, logout } = useAuthStore();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.uid) {
        const [restaurantsRes, ordersRes] = await Promise.all([
          restaurantAPI.getAll(),
          Promise.resolve({ data: [] }), // Placeholder
        ]);
        setRestaurants(restaurantsRes.data);
        setOrders(ordersRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleImageSelected = async (uri: string, restaurantId: string) => {
    if (!uri) return;

    try {
      const fileName = uri.split('/').pop() || `restaurant_${Date.now()}`;
      const contentType = 'image/jpeg';

      const res = await restaurantAPI.getImageUploadUrl(restaurantId, { fileName, contentType });
      const { url, filePath } = res.data;

      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      const photoURL = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;

      await restaurantAPI.update(restaurantId, { photoURL });

      setRestaurants(prev => 
        prev.map(r => (r._id === restaurantId ? { ...r, photoURL } : r))
      );

      Alert.alert('Success', 'Restaurant picture updated!');
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Restaurant Partner</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="receipt" size={32} color={colors.text} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="cash" size={32} color={colors.text} />
            <Text style={[styles.statNumber, { color: colors.text }]}>$0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Revenue</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Restaurants</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(restaurant)/add-restaurant')}>
                <Ionicons name="add" size={20} color={colors.background} />
                <Text style={[styles.addButtonText, { color: colors.background }]}>Add New</Text>
            </TouchableOpacity>
          </View>
          {restaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No restaurants yet</Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <View key={restaurant._id} style={[styles.restaurantCard, { backgroundColor: colors.backgroundSecondary }]}>
                <ReusableImagePicker 
                  currentImage={restaurant.photoURL}
                  onImageSelected={(uri) => handleImageSelected(uri, restaurant._id)} 
                />
                <View style={styles.restaurantInfo}>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
                  <Text style={[styles.restaurantMeta, { color: colors.textSecondary }]}>{restaurant.cuisine}</Text>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.smallButton, { backgroundColor: colors.border }]} onPress={() => router.push(`/(restaurant)/menu/add-item?restaurantId=${restaurant._id}`)}>
                        <Text style={[styles.smallButtonText, { color: colors.text }]}>Add Item</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallButton, { backgroundColor: colors.border, marginLeft: 8 }]} onPress={() => router.push(`/(restaurant)/menu/${restaurant._id}`)}>
                        <Text style={[styles.smallButtonText, { color: colors.text }]}>View Menu</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
          {orders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No orders yet</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order._id} style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.orderText, { color: colors.text }]}>Order #{order._id}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  greeting: { fontSize: 14 },
  name: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
  statNumber: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { marginLeft: 4, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, marginTop: 16, marginBottom: 24 },
  emptyCard: { padding: 32, borderRadius: 12, alignItems: 'center' },
  emptyCardText: { fontSize: 14 },
  restaurantCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  restaurantInfo: { flex: 1, marginLeft: 16 },
  restaurantName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  restaurantMeta: { fontSize: 14, marginBottom: 12 },
  buttonContainer: { flexDirection: 'row' },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  smallButtonText: { fontSize: 12, fontWeight: '600' },
  orderCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  orderText: { fontSize: 16, fontWeight: '500' },
});
