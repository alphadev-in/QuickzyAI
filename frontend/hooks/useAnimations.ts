import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

// Spring animation configuration
const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

// Fade In Animation
export const useFadeIn = (delay = 0, duration = 600) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration,
      delay,
    });
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
};

// Slide In From Bottom
export const useSlideInBottom = (delay = 0) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, springConfig, () => {});
    opacity.value = withTiming(1, { duration: 400, delay });
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
};

// Slide In From Right
export const useSlideInRight = (delay = 0) => {
  const translateX = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(0, springConfig);
    opacity.value = withTiming(1, { duration: 400, delay });
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
};

// Scale In Animation
export const useScaleIn = (delay = 0) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: 400, delay });
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
};

// Bounce Animation
export const useBounce = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2, stiffness: 100 }),
        withSpring(1, { damping: 2, stiffness: 100 })
      ),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
};

// Pulse Animation
export const usePulse = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
};

// Shake Animation
export const useShake = (trigger: boolean) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
};

// Shimmer Loading Animation
export const useShimmer = () => {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-1, 1],
          [-300, 300],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
};

// Rotate Animation
export const useRotate = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
};

// Press Animation Hook
export const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 100 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
};

// Staggered List Animation
export const useStaggeredAnimation = (index: number, itemsPerRow = 1) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const delay = (index % itemsPerRow) * 100;
    
    opacity.value = withTiming(1, {
      duration: 400,
      delay,
    });
    
    translateY.value = withSpring(0, {
      ...springConfig,
      delay,
    });
  }, [index]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
};

// Skeleton Shimmer Styles
export const shimmerStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
