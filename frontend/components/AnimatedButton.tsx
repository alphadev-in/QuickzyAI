import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressAnimation } from '../hooks/useAnimations';
import { Ionicons } from '@expo/vector-icons';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  backgroundColor?: string;
}

export const AnimatedButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  color,
  backgroundColor,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: [styles.primaryButton, backgroundColor && { backgroundColor }],
          text: [styles.primaryText, color && { color }],
        };
      case 'secondary':
        return {
          button: [styles.secondaryButton, backgroundColor && { backgroundColor }],
          text: [styles.secondaryText, color && { color }],
        };
      case 'outline':
        return {
          button: [styles.outlineButton, backgroundColor && { borderColor: backgroundColor }],
          text: [styles.outlineText, color && { color }],
        };
      case 'ghost':
        return {
          button: styles.ghostButton,
          text: [styles.ghostText, color && { color }],
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { button: styles.smallButton, text: styles.smallText };
      case 'large':
        return { button: styles.largeButton, text: styles.largeText };
      default:
        return { button: styles.mediumButton, text: styles.mediumText };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#000000'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles.text.fontSize * 1.2}
              color={variantStyles.text[0].color}
              style={styles.iconLeft}
            />
          )}
          <Text style={[variantStyles.text, sizeStyles.text, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles.text.fontSize * 1.2}
              color={variantStyles.text[0].color}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Variants
  primaryButton: {
    backgroundColor: '#000000',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryText: {
    color: '#000000',
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
  },
  outlineText: {
    color: '#000000',
    fontWeight: '600',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostText: {
    color: '#000000',
    fontWeight: '500',
  },
  // Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  smallText: {
    fontSize: 14,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  mediumText: {
    fontSize: 16,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  largeText: {
    fontSize: 18,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
