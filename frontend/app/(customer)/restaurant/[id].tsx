import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { restaurantAPI } from '../../../services/api';
import { useThemeColor } from '../../../hooks/useColorScheme';
import { useAuthStore } from '../../../store/authStore';

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colors = useThemeColor();
  const { user } = useAuthStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      if (typeof id !== 'string') return;
      const [resRestaurant, resMenu, resReviews] = await Promise.all([
        restaurantAPI.getById(id),
        restaurantAPI.getMenu(id),
        restaurantAPI.getReviews(id),
      ]);
      setRestaurant(resRestaurant.data);
      setMenu(resMenu.data);
      setReviews(resReviews.data);
    } catch (error) {
      console.error('Failed to load restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user || typeof id !== 'string') {
      Alert.alert('Please login', 'You need to be logged in to post a review.');
      return;
    }
    if (rating === 0 || review.trim() === '') {
      Alert.alert('Incomplete', 'Please provide a rating and a comment.');
      return;
    }

    try {
      const reviewData = {
        userId: user.uid,
        rating,
        comment: review,
      };
      const res = await restaurantAPI.addReview(id, reviewData);
      setReviews([res.data, ...reviews]);
      setReview('');
      setRating(0);
      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      Alert.alert('Error', 'Could not submit your review.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!restaurant) {
    return <Text>Restaurant not found</Text>;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
        <ScrollView style={styles.container}>
            <Image source={{ uri: restaurant.photoURL }} style={styles.image} />
            <View style={styles.detailsContainer}>
                <Text style={[styles.name, {color: colors.text}]}>{restaurant.name}</Text>
                <Text style={[styles.cuisine, {color: colors.textSecondary}]}>{restaurant.cuisine}</Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={'#FFC700'} />
                    <Text style={[styles.ratingText, {color: colors.text}]}>{restaurant.rating.average.toFixed(1)} ({restaurant.rating.count} reviews)</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}>Menu</Text>
                {menu.map(item => (
                    <View key={item._id} style={[styles.menuItem, {backgroundColor: colors.backgroundSecondary}]}>
                        <Text style={{color: colors.text}}>{item.name}</Text>
                        <Text style={{color: colors.textSecondary}}>${item.price}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}>Reviews</Text>
                <View style={[styles.reviewForm, {backgroundColor: colors.backgroundSecondary}]}>
                    <Text style={[styles.addReviewTitle, {color: colors.text}]}>Add Your Review</Text>
                    <View style={styles.starContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={30} color={"#FFC700"} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        style={[styles.reviewInput, {color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="Write your review..."
                        value={review}
                        onChangeText={setReview}
                        multiline
                    />
                    <TouchableOpacity style={[styles.submitButton, {backgroundColor: colors.primary}]} onPress={handleReviewSubmit}>
                        <Text style={{color: colors.background}}>Submit Review</Text>
                    </TouchableOpacity>
                </View>

                {reviews.map(rev => (
                    <View key={rev._id} style={[styles.reviewItem, {backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border}]}>
                        <Text style={{color: colors.text, fontWeight: 'bold'}}>{rev.userId}</Text> 
                        <View style={styles.starContainer}>
                            {[...Array(rev.rating)].map((_, i) => <Ionicons key={i} name="star" size={16} color={'#FFC700'} />)}
                        </View>
                        <Text style={{color: colors.textSecondary}}>{rev.comment}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: '100%', height: 250 },
    detailsContainer: { padding: 20 },
    name: { fontSize: 24, fontWeight: 'bold' },
    cuisine: { fontSize: 16, marginVertical: 4 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { marginLeft: 8 },
    section: { padding: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, marginBottom: 10 },
    reviewForm: { padding: 15, borderRadius: 10, marginBottom: 20 },
    addReviewTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    starContainer: { flexDirection: 'row', marginBottom: 10 },
    reviewInput: { padding: 10, borderRadius: 5, borderWidth: 1, minHeight: 100, marginBottom: 10 },
    submitButton: { padding: 15, borderRadius: 10, alignItems: 'center' },
    reviewItem: { padding: 15, borderBottomWidth: 1, marginBottom: 10, borderRadius: 10 },
});
