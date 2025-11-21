import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const callerUid = decodedToken.uid;

        // Check if caller is admin in Firestore
        const callerDoc = await adminDb.collection('users').doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Update the user's password
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error: any) {
        console.error('Error setting password:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            code: error.code
        }, { status: 500 });
    }
}
