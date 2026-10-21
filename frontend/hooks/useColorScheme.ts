import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export function useColorScheme() {
  const colorScheme = useRNColorScheme() ?? 'dark';
  return colorScheme;
}

export function useThemeColor() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme];
}