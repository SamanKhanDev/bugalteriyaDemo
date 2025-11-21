import { Timestamp } from 'firebase/firestore';

export interface User {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: Timestamp;
    role: 'user' | 'admin';
    totalActiveSeconds: number;
    lastSeen: Timestamp;
    profilePhotoUrl?: string;
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
