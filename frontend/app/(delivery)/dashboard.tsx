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
import { deliveryPartnerAPI, orderAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function DeliveryDashboard() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user, logout } = useAuthStore();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.uid) {
        const [availableRes, myOrdersRes] = await Promise.all([
          orderAPI.getAvailable(),
          deliveryPartnerAPI.getOrders(user.uid),
        ]);
        setAvailableOrders(availableRes.data);
        setMyOrders(myOrdersRes.data);
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

    const handleAcceptOrder = async (order: any) => {
        if (!user?.uid) return;

        try {
            const res = await deliveryPartnerAPI.acceptOrder(user.uid, order._id);
            setAvailableOrders(prev => prev.filter(o => o._id !== order._id));
            setMyOrders(prev => [res.data.order, ...prev]);
            Alert.alert('Order Accepted', `You have accepted order #${order._id.slice(-6)}`);
        } catch (error) {
            console.error('Failed to accept order:', error);
            Alert.alert('Error', 'Could not accept the order. It might have been taken already.');
            loadData(); // Refresh data to get latest available orders
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
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Delivery Partner</Text>
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
        <View style={styles.statusSection}>
          <TouchableOpacity
            style={[styles.onlineToggle, { backgroundColor: isOnline ? colors.primary : colors.backgroundSecondary }]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Ionicons name={isOnline ? 'radio-button-on' : 'radio-button-off'} size={24} color={isOnline ? colors.background : colors.text} />
            <Text style={[styles.onlineText, { color: isOnline ? colors.background : colors.text }]}>
              {isOnline ? "You're Online" : "You're Offline"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.onlineSubtext, { color: colors.textSecondary }]}>
            {isOnline ? 'You can now see and accept new orders' : 'Go online to start receiving orders'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="bicycle" size={28} color={colors.text} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{myOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Deliveries</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="cash" size={28} color={colors.text} />
            <Text style={[styles.statNumber, { color: colors.text }]}>$0.00</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Earnings</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Orders</Text>
          {!isOnline ? (
             <View style={[styles.offlineCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.offlineText, { color: colors.textSecondary }]}>Go online to see available orders</Text>
            </View>
          ) : availableOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No new orders right now</Text>
            </View>
          ) : (
            availableOrders.map((order) => (
              <View key={order._id} style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderTitle, { color: colors.text }]}>Order #{order._id.slice(-6)}</Text>
                  <Text style={[styles.orderMeta, { color: colors.textSecondary }]}>{order.items?.length || 0} items</Text>
                  <Text style={[styles.orderMeta, { color: colors.primary, fontWeight: 'bold' }]}>${order.total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]} onPress={() => handleAcceptOrder(order)}>
                  <Text style={[styles.acceptText, { color: colors.background }]}>Accept</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Active Deliveries</Text>
          {myOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundSecondary }]}>
                 <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You have no active deliveries</Text>
            </View>
          ) : (
            myOrders.map((order) => (
              <View key={order._id} style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.orderTitle, { color: colors.text }]}>Order #{order._id.slice(-6)}</Text>
                {/* Add more order details and actions like 'Mark as Delivered' */}
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
    statusSection: { paddingHorizontal: 20, marginBottom: 24, alignItems: 'center' },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, width: '100%' },
    onlineText: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
    onlineSubtext: { fontSize: 14, textAlign: 'center', marginTop: 8 },
    statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24 },
    statCard: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
    statNumber: { fontSize: 28, fontWeight: '700', marginTop: 8 },
    statLabel: { fontSize: 12, marginTop: 4 },
    section: { marginBottom: 24, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    offlineCard: { padding: 40, borderRadius: 12, alignItems: 'center' },
    offlineText: { fontSize: 14, marginTop: 16, textAlign: 'center' },
    emptyCard: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
    orderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
    orderInfo: { flex: 1 },
    orderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    orderMeta: { fontSize: 14, marginBottom: 2 },
    acceptButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    acceptText: { fontSize: 14, fontWeight: '700' },
});
