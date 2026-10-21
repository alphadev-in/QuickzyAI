
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useColorScheme';
import { restaurantAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddRestaurantScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddRestaurant = async () => {
    if (!name || !description || !cuisine || !street || !city || !state || !zipCode) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const newRestaurant = {
        ownerId: user?.uid,
        name,
        description,
        cuisine,
        address: {
          street,
          city,
          state,
          zipCode,
          label: 'main',
        },
      };

      await restaurantAPI.create(newRestaurant);
      router.back();
    } catch (error) {
      console.error('Error creating restaurant:', error);
      Alert.alert('Error', 'Failed to create restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Add New Restaurant</Text>

          <TextInput
            style={styles.input(colors)}
            placeholder="Restaurant Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="Cuisine (e.g., Italian, Mexican)"
            placeholderTextColor={colors.textSecondary}
            value={cuisine}
            onChangeText={setCuisine}
          />

          <Text style={[styles.subtitle, { color: colors.text }]}>Address</Text>
          <TextInput
            style={styles.input(colors)}
            placeholder="Street Address"
            placeholderTextColor={colors.textSecondary}
            value={street}
            onChangeText={setStreet}
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="State"
            placeholderTextColor={colors.textSecondary}
            value={state}
            onChangeText={setState}
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="Zip Code"
            placeholderTextColor={colors.textSecondary}
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleAddRestaurant}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Add Restaurant</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 16 },
  input: (colors) => ({
    height: 56,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  button: { height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  buttonText: { fontSize: 18, fontWeight: '600' },
  cancelButton: { alignItems: 'center', marginTop: 16 },
});
