import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generates a unique 6-digit ID for a user
 * Checks Firestore to ensure uniqueness
 */
export async function generateUniqueId(): Promise<string> {
    let uniqueId: string;
    let isUnique = false;

    while (!isUnique) {
        // Generate random 6-digit number (100000 to 999999)
        uniqueId = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if this ID already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uniqueId', '==', uniqueId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            isUnique = true;
        }
    }

    return uniqueId!;
}
