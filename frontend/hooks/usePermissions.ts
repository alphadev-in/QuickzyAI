import { useEffect } from 'react';
import * as Location from 'expo-location';
// import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

export const usePermissions = () => {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request Location Permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Quickzy needs location access to find nearby restaurants and track deliveries.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }

      // Request Background Location (for delivery partners)
      if (Platform.OS === 'android') {
        await Location.requestBackgroundPermissionsAsync();
      }

      // Request Notification Permission
      // const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      
      // if (notificationStatus !== 'granted') {
      //   Alert.alert(
      //     'Notification Permission Required',
      //     'Enable notifications to receive order updates and delivery alerts.',
      //     [
      //       { text: 'Cancel', style: 'cancel' },
      //       { text: 'Open Settings', onPress: () => Notifications.requestPermissionsAsync() }
      //     ]
      //   );
      // }

      // Get and log push notification token
      // if (notificationStatus === 'granted') {
      //   const token = await Notifications.getExpoPushTokenAsync();
      //   console.log('Push notification token:', token.data);
      //   // TODO: Send this token to your backend to store for the user
      // }

    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  return null;
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// Watch location changes (for delivery partners)
export const watchLocation = async (callback: (location: any) => void) => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return null;
    }

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
          heading: location.coords.heading,
        });
      }
    );
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
};

// Send local notification
// export const sendLocalNotification = async (title: string, body: string, data?: any) => {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         data,
//         sound: true,
//       },
//       trigger: null, // Show immediately
//     });
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }
// };
