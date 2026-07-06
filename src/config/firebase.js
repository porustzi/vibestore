import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyCbqI-fh2K0RMMA_SyXMHT2r4j5YXulUQM",
  authDomain: "vibe-store-project.firebaseapp.com",
  projectId: "vibe-store-project",
  storageBucket: "vibe-store-project.firebasestorage.app",
  messagingSenderId: "364551371666",
  appId: "1:364551371666:web:bf1aabc1d59c1caf009f4b",
  measurementId: "G-R3OHE4XVSG"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const analytics = getAnalytics(app)

export { db, analytics }
