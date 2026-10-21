
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useThemeColor } from '../../hooks/useColorScheme';
import { restaurantAPI, Restaurant } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await restaurantAPI.getAll();
        setRestaurants(response.data);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        Alert.alert('Error Loading Restaurants', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => router.push(`/(customer)/restaurant/${item._id}`)}
    >
      <Image source={{ uri: item.photoURL }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>{item.name}</Text>
        <Text style={{ color: colors.textSecondary }}>{item.cuisine}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
             <Text style={[styles.title, { color: colors.text }]}>Restaurants Near You</Text>
        </View>
     
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 20}}/>
      ) : (
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  restaurantCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,

  },
  restaurantImage: {
    width: 100,
    height: 100,
  },
  restaurantInfo: {
    padding: 12,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
