
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '../../../hooks/useColorScheme';
import { restaurantAPI } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddMenuItemScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { restaurantId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMenuItem = async () => {
    if (!name || !description || !price || !category) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const newMenuItem = {
        name,
        description,
        price: parseFloat(price),
        category,
      };

      await restaurantAPI.addMenuItem(restaurantId as string, newMenuItem);
      router.back();
    } catch (error) {
      console.error('Error creating menu item:', error);
      Alert.alert('Error', 'Failed to create menu item. Please try again.');
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
          <Text style={[styles.title, { color: colors.text }]}>Add Menu Item</Text>

          <TextInput
            style={styles.input(colors)}
            placeholder="Item Name"
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
            placeholder="Price"
            placeholderTextColor={colors.textSecondary}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input(colors)}
            placeholder="Category"
            placeholderTextColor={colors.textSecondary}
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleAddMenuItem}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Add Item</Text>
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
