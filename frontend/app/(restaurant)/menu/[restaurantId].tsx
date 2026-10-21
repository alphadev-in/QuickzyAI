
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColor } from '../../../hooks/useColorScheme';
import { restaurantAPI } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { restaurantId } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantAPI.getById(restaurantId as string),
        restaurantAPI.getMenu(restaurantId as string),
      ]);
      setRestaurant(restaurantRes.data);
      setMenu(menuRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{restaurant.name} - Menu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {menu.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fast-food" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No menu items yet</Text>
          </View>
        ) : (
          menu.map((item) => (
            <View key={item.id} style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  emptyState: { padding: 40, alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: 16, marginTop: 16 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginHorizontal: 20, marginBottom: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  itemDescription: { fontSize: 14, flexWrap: 'wrap' },
  itemPrice: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
});
