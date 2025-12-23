import { Timestamp } from 'firebase/firestore';

export interface User {
    userId: string;
    uniqueId: string; // 6-digit unique ID for display
    name: string;
    email: string;
    phone?: string;
    createdAt: Timestamp;
    role: 'user' | 'admin';
    totalActiveSeconds: number;
    lastSeen: Timestamp;
    profilePhotoUrl?: string;
    isGuest?: boolean;
}

export interface UserTimer {
    userId: string;
    remainingTime: number;
    lastSyncedAt: Timestamp;
    history: Array<{
        type: 'init' | 'admin_add' | 'payment';
        seconds: number;
        reason: string;
        at: Timestamp;
        adminId?: string;
    }>;
}

export interface TestStage {
    stageId: string;
    stageNumber: number;
    title: string;
    description: string;
    isLocked: boolean;
    videoUrl?: string;
    videoRequiredPercent?: number;
    totalQuestions: number;
}

export interface Question {
    questionId: string;
    order: number;
    questionText: string;
    explanation?: string;
}

export interface Option {
    optionId?: string;
    text: string;
    isCorrect: boolean;
}

export interface UserProgress {
    userId: string;
    currentStageId: string;
    completedStages: string[];
    perStage: {
        [stageId: string]: {
            completed: boolean;
            correctCount: number;
            wrongCount: number;
            timeSpentSeconds: number;
            startedAt: Timestamp | string;
            finishedAt?: Timestamp | string;
            videoWatchedSeconds?: number;
            videoCompleted?: boolean;
        };
    };
    totalCorrect: number;
    totalWrong: number;
}

export interface Session {
    sessionId: string;
    userId: string;
    startedAt: Timestamp;
    endedAt?: Timestamp;
    lastPingAt: Timestamp;
}

export interface Certificate {
    certificateId: string;
    userId: string;
    userName: string;
    issuedAt: Timestamp;
    issuedBy: string; // admin userId
    certificateNumber: string;
    completionDate: Timestamp;
    totalStages: number;
    totalScore: number;
}

export interface AdminAction {
    actionId: string;
    adminId: string;
    actionType: 'reset_password' | 'add_time' | 'lock_user' | 'unlock_user' | 'create_stage' | 'upload_video' | 'issue_certificate';
    targetUserId?: string;
    payload: any;
    createdAt: Timestamp;
}

// Quick Test Interfaces
export interface QuickTest {
    testId: string;
    title: string;
    description: string;
    createdBy: string; // admin userId
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isActive: boolean;
    totalLevels: number;
    timeLimit?: number; // seconds per level (optional)
    certificateThreshold?: number; // percentage required for certificate
    activeDate?: string; // date in YYYY-MM-DD format (e.g., "2025-11-29")
    activeStartDate?: string; // start date in YYYY-MM-DD format
    activeEndDate?: string; // end date in YYYY-MM-DD format
    activeTimeFrom?: string; // start time in HH:mm format (e.g., "11:00")
    activeTimeTo?: string; // end time in HH:mm format (e.g., "15:00")
}

export interface QuickTestLevel {
    levelId: string;
    testId: string;
    levelNumber: number;
    title: string;
    questions: QuickTestQuestion[];
    timeLimit?: number; // seconds for this level
}

export interface QuickTestQuestion {
    questionId: string;
    questionText: string;
    imageUrl?: string; // Google Drive image URL
    options: QuickTestOption[];
    explanation?: string;
}

export interface QuickTestOption {
    optionId: string;
    text: string;
    isCorrect: boolean;
}

export interface QuickTestResult {
    resultId: string;
    testId: string;
    userId: string;
    userName: string;
    isGuest?: boolean; // true if user is a guest
    levelId: string;
    levelNumber: number;
    score: number; // correct answers count
    totalQuestions: number;
    timeSpentSeconds: number;
    answers: Array<{
        questionId: string;
        selectedOptionId: string;
        isCorrect: boolean;
    }>;
    startedAt?: Timestamp; // when the test was started
    completedAt: Timestamp;
}
