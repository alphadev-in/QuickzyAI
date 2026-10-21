import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../hooks/useColorScheme';
import { orderAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export default function OrdersScreen() {
  const colors = useThemeColor();
  const user = useAuthStore(state => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      if (user?.id) {
        const response = await orderAPI.getByCustomer(user.id);
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return colors.text;
      case 'cancelled':
        return colors.error;
      case 'on_the_way':
      case 'picked_up':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Orders</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No orders yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start ordering from your favorite restaurants
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderId, { color: colors.textSecondary }]}>
                    Order #{order.id.slice(-6)}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
                    {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.orderDetails}>
                <Text style={[styles.itemCount, { color: colors.text }]}>
                  {order.items.length} items
                </Text>
                <Text style={[styles.orderTotal, { color: colors.text }]}>
                  ${order.total.toFixed(2)}
                </Text>
              </View>

              <View style={styles.orderItems}>
                {order.items.slice(0, 2).map((item: any, index: number) => (
                  <Text key={index} style={[styles.itemText, { color: colors.textSecondary }]}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
                {order.items.length > 2 && (
                  <Text style={[styles.moreItems, { color: colors.textTertiary }]}>
                    +{order.items.length - 2} more
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 14,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderItems: {
    marginTop: 4,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    marginTop: 4,
  },
});