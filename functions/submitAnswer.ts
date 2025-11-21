import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface SubmitAnswerData {
    userId: string;
    stageId: string;
    questionId: string;
    selectedOptionId: string;
}

export const submitAnswer = functions.https.onCall(async (data: SubmitAnswerData, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = context.auth.uid;
    if (userId !== data.userId) {
        throw new functions.https.HttpsError('permission-denied', 'User ID mismatch.');
    }

    // 2. Timer Check
    const timerDoc = await db.collection('userTimers').doc(userId).get();
    if (!timerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User timer not found.');
    }
    const remainingTime = timerDoc.data()?.remainingTime || 0;

    if (remainingTime <= 0) {
        throw new functions.https.HttpsError('failed-precondition', 'Time expired. Please top up.');
    }

    // 3. Fetch Question & Correct Answer
    // In a real app, you might store correct answers in a separate private collection 
    // or check the 'isCorrect' field on the option if your security rules allow admin-only read of that field.
    // Here we assume we can read the question structure.
    const questionRef = db.collection('testStages').doc(data.stageId)
        .collection('questions').doc(data.questionId);
    const optionRef = questionRef.collection('options').doc(data.selectedOptionId);

    const optionSnap = await optionRef.get();
    if (!optionSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Option not found.');
    }

    const isCorrect = optionSnap.data()?.isCorrect === true;
    const explanation = (await questionRef.get()).data()?.explanation || '';

    // 4. Update User Progress
    const progressRef = db.collection('userProgress').doc(userId);

    await db.runTransaction(async (transaction) => {
        const progressSnap = await transaction.get(progressRef);

        let progressData = progressSnap.exists ? progressSnap.data()! : {
            currentStageId: data.stageId,
            completedStages: [],
            perStage: {},
            totalCorrect: 0,
            totalWrong: 0
        };

        // Initialize stage data if missing
        if (!progressData.perStage[data.stageId]) {
            progressData.perStage[data.stageId] = {
                completed: false,
                correctCount: 0,
                wrongCount: 0,
                timeSpentSeconds: 0,
                startedAt: admin.firestore.Timestamp.now()
            };
        }

        // Update counts
        if (isCorrect) {
            progressData.perStage[data.stageId].correctCount += 1;
            progressData.totalCorrect += 1;
        } else {
            progressData.perStage[data.stageId].wrongCount += 1;
            progressData.totalWrong += 1;
        }

        // Check for stage completion (Example: if all questions answered or pass threshold)
        // This logic depends on knowing total questions for the stage.
        // For now, we just update the stats.

        transaction.set(progressRef, progressData, { merge: true });
    });

    // 5. Return Result to Client
    return {
        correct: isCorrect,
        explanation: explanation,
        remainingTime: remainingTime // Optional: return server time to sync client
    };
});
