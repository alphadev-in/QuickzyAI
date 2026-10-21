import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useStaggeredAnimation, usePressAnimation } from '../hooks/useAnimations';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    cuisineTypes: string[];
    rating: number;
    deliveryFee: number;
    estimatedDeliveryTime: string;
    isOpen: boolean;
  };
  index: number;
  onPress: () => void;
  isDark?: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  index,
  onPress,
  isDark = false,
}) => {
  const staggeredStyle = useStaggeredAnimation(index);
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const colors = {
    card: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    textTertiary: isDark ? '#777777' : '#999999',
    border: isDark ? '#333333' : '#E0E0E0',
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, staggeredStyle, animatedStyle]}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="restaurant" size={48} color={colors.textTertiary} />
          </View>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: restaurant.isOpen ? '#000000' : '#999999' }
        ]}>
          <Text style={styles.statusText}>
            {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        
        <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
          {restaurant.cuisineTypes.join(' • ')}
        </Text>

        {/* Meta Info */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {restaurant.estimatedDeliveryTime}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              ${restaurant.deliveryFee.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
});
