import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase web config is not secret: access is enforced by Firestore rules
// and Auth authorized domains. Fetched with:
//   npx -y firebase-tools@latest apps:sdkconfig WEB 1:239045288293:web:23b4d2d2b47368b5e0418c
const firebaseConfig = {
  apiKey: 'AIzaSyCtFdU8s6kD5c4mGMpXsGlq2WT_y86pRtA',
  authDomain: 'dmb-portfolio.firebaseapp.com',
  projectId: 'dmb-portfolio',
  storageBucket: 'dmb-portfolio.firebasestorage.app',
  messagingSenderId: '239045288293',
  appId: '1:239045288293:web:23b4d2d2b47368b5e0418c',
  measurementId: 'G-8GQXG6HT2G',
}

// Auth lives in src/login/auth.ts so the public page doesn't ship it.
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
