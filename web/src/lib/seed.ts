import { db } from './firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { TestStage, Question, Option } from './schema';

export const seedDatabase = async () => {
    console.log('Starting database seed...');
    const batch = writeBatch(db);

    // Create 3 Stages
    for (let i = 1; i <= 3; i++) {
        const stageId = `stage-${i}`;
        const stageRef = doc(db, 'testStages', stageId);

        const stageData: TestStage = {
            stageId,
            stageNumber: i,
            title: `Module ${i}: ${getModuleTitle(i)}`,
            description: `Master the fundamentals of ${getModuleTitle(i)} in this comprehensive module.`,
            isLocked: i > 1, // Lock stages 2 and 3 initially (globally, though user progress overrides this usually)
            totalQuestions: 10,
            videoUrl: i === 2 ? 'https://www.w3schools.com/html/mov_bbb.mp4' : undefined, // Demo video for stage 2
            videoRequiredPercent: i === 2 ? 80 : 0
        };

        batch.set(stageRef, stageData);

        // Create 10 Questions per Stage
        for (let q = 1; q <= 10; q++) {
            const questionId = `q-${i}-${q}`;
            const questionRef = doc(collection(stageRef, 'questions'), questionId);

            const questionData: Question = {
                questionId,
                order: q,
                questionText: `Question ${q} for Module ${i}: What is the correct accounting treatment for...?`,
                explanation: 'This is the explanation for the correct answer.'
            };

            batch.set(questionRef, questionData);

            // Create 4 Options per Question
            for (let o = 1; o <= 4; o++) {
                const optionId = `opt-${i}-${q}-${o}`;
                const optionRef = doc(collection(questionRef, 'options'), optionId);
                const isCorrect = o === 1; // First option is always correct for demo

                const optionData: Option = {
                    optionId,
                    text: `Option ${o} Answer`,
                    isCorrect
                };

                batch.set(optionRef, optionData);
            }
        }
    }

    await batch.commit();
    console.log('Database seeded successfully!');
};

function getModuleTitle(num: number) {
    switch (num) {
        case 1: return 'Introduction to Accounting';
        case 2: return 'Balance Sheet Basics';
        case 3: return 'Cash Flow Analysis';
        default: return 'Advanced Topics';
    }
}
