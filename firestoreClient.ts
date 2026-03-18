import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from './firebaseClient';

export const db = getFirestore(firebaseApp);

