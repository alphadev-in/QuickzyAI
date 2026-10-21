import React from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { orderAPI } from '../../../services/api';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

const CartScreen = () => {
  const { items, restaurantId, restaurantName, getTotal, clearCart, updateQuantity } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColor();

  const handlePlaceOrder = async () => {
    if (!user || !restaurantId) {
      Alert.alert('Error', 'You must be logged in and have items in your cart to place an order.');
      return;
    }

    const orderData = {
      userId: user.uid,
      restaurantId,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      })),
      total: getTotal(),
      status: 'pending',
    };

    try {
      const { data: newOrder } = await orderAPI.create(orderData);
      clearCart();
      router.push({
        pathname: '/(customer)/orders',
        params: { orderId: newOrder._id },
      });
      Alert.alert('Order Placed!', 'Your order has been successfully placed.');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'There was an issue placing your order. Please try again.');
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity onPress={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
          <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.itemQuantity, { color: colors.text }]}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
          <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>Your cart is empty</Text>
        <Button title="Go Shopping" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurantName}</Text>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.menuItemId}
        contentContainerStyle={styles.list}
      />
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.total, { color: colors.text }]}>Total: ${getTotal().toFixed(2)}</Text>
        <TouchableOpacity style={[styles.orderButton, { backgroundColor: colors.primary }]} onPress={handlePlaceOrder}>
          <Text style={[styles.orderButtonText, { color: colors.background }]}>Place Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={() => clearCart()}>
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
  list: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 14,
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 16,
    marginHorizontal: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  orderButton: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
      marginTop: 10,
  },
  clearButtonText: {
      fontSize: 14
  }
});

export default CartScreen;
