/**
 * Migration Script: Add uniqueId to existing users
 * 
 * This script adds a unique 6-digit ID to all existing users who don't have one.
 * Run this once to update all existing users in the database.
 * 
 * To run: node scripts/addUniqueIdToUsers.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBICvv3HmBTCmfwZdlA6lqSaZ8zPPGB6cU",
    authDomain: "buglateriya-team.firebaseapp.com",
    projectId: "buglateriya-team",
    storageBucket: "buglateriya-team.firebasestorage.app",
    messagingSenderId: "319328450738",
    appId: "1:319328450738:web:0aabdf56f3c4c010bb31ab",
    measurementId: "G-VECYFXZ1LS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateUniqueId(existingIds: Set<string>): Promise<string> {
    let uniqueId: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;

        if (attempts > maxAttempts) {
            throw new Error('Could not generate unique ID after maximum attempts');
        }
    } while (existingIds.has(uniqueId));

    existingIds.add(uniqueId);
    return uniqueId;
}

async function addUniqueIdToUsers() {
    try {
        console.log('🚀 Starting migration: Adding uniqueId to existing users...\n');

        // Get all users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        console.log(`📊 Found ${usersSnapshot.size} users in database\n`);

        // Collect existing unique IDs
        const existingIds = new Set<string>();
        const usersToUpdate: { id: string; name: string }[] = [];

        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.uniqueId) {
                existingIds.add(data.uniqueId);
            } else {
                usersToUpdate.push({ id: doc.id, name: data.name || 'Unknown' });
            }
        });

        console.log(`✅ ${existingIds.size} users already have uniqueId`);
        console.log(`🔄 ${usersToUpdate.length} users need uniqueId\n`);

        if (usersToUpdate.length === 0) {
            console.log('✨ All users already have uniqueId. Migration complete!');
            return;
        }

        // Update users without uniqueId
        let updated = 0;
        for (const user of usersToUpdate) {
            try {
                const uniqueId = await generateUniqueId(existingIds);
                const userRef = doc(db, 'users', user.id);

                await updateDoc(userRef, {
                    uniqueId: uniqueId
                });

                updated++;
                console.log(`✓ Updated user: ${user.name} (${user.id}) → ID: ${uniqueId}`);
            } catch (error) {
                console.error(`✗ Failed to update user ${user.id}:`, error);
            }
        }

        console.log(`\n✨ Migration complete! Updated ${updated}/${usersToUpdate.length} users`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
addUniqueIdToUsers()
    .then(() => {
        console.log('\n🎉 Migration finished successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    });
