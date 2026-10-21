import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBeuUHB43t5yVs5KbzJ3iqZ0nxgy1XMQx4",
  authDomain: "allshoplocaluk.firebaseapp.com",
  projectId: "allshoplocaluk",
  storageBucket: "allshoplocaluk.firebasestorage.app",
  messagingSenderId: "980182296141",
  appId: "1:980182296141:web:f61471ea6cfd455ad1de04",
  measurementId: "G-NKE9CHEJGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const storage = getStorage(app);
export { auth };

export default app;
