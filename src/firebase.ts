import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDTOAT0AOwn4ove73ojV-11mrhPwwQN7SY',
  authDomain: 'dukaan-manager-f7408.firebaseapp.com',
  databaseURL: 'https://dukaan-manager-f7408-default-rtdb.firebaseio.com',
  projectId: 'dukaan-manager-f7408',
  storageBucket: 'dukaan-manager-f7408.firebasestorage.app',
  messagingSenderId: '396654590801',
  appId: '1:396654590801:web:8cdc26994138694740f170',
  measurementId: 'G-9M06FK7M98'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
