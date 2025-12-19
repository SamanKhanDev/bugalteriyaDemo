'use client';

import { useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';

interface UseScreenshotProtectionOptions {
    enabled: boolean;
    userId?: string;
    userName?: string;
    testId?: string;
    testTitle?: string;
}

export function useScreenshotProtection({
    enabled,
    userId,
    userName,
    testId,
    testTitle
}: UseScreenshotProtectionOptions) {
    const { user } = useStore();
    const [isBlackout, setIsBlackout] = useState(false);
    const [isWarningActive, setIsWarningActive] = useState(false);
    const modifiersRef = useRef({ meta: false, shift: false, ctrl: false });

    // Refs for latest identity
    const identityRef = useRef({
        userId: userId || 'anonymous',
        userName: userName || 'Anonymous User'
    });

    useEffect(() => {
        identityRef.current = {
            userId: userId || 'anonymous',
            userName: userName || 'Anonymous User'
        };
    }, [userId, userName]);

    // Explicitly disable for admins
    const isActuallyEnabled = enabled && user?.role !== 'admin';

    // Logging is now handled globally by ContentProtection component
    // to avoid duplicate logs in Firestore.
    const logViolation = useCallback(async (type: string) => {
        // console.log('Violation caught by hook:', type);
    }, []);

    const triggerBlackout = useCallback(() => {
        setIsBlackout(true);
        setTimeout(() => setIsBlackout(false), 2000);
    }, []);

    const showToast = useCallback((msg: string) => {
        if (typeof document === 'undefined') return;

        const warning = document.createElement('div');
        warning.innerText = msg;
        warning.style.position = 'fixed';
        warning.style.top = '20px';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.backgroundColor = '#ef4444';
        warning.style.color = 'white';
        warning.style.padding = '12px 24px';
        warning.style.borderRadius = '9999px';
        warning.style.zIndex = '1000000';
        warning.style.fontWeight = '600';
        warning.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        warning.style.transition = 'all 0.3s ease';
        document.body.appendChild(warning);

        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }, []);

    useEffect(() => {
        if (!isActuallyEnabled) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            showToast("O'ng tugmani bosish taqiqlangan!");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Track modifier keys
            modifiersRef.current = {
                meta: e.metaKey || e.key === 'Meta',
                shift: e.shiftKey || e.key === 'Shift',
                ctrl: e.ctrlKey || e.key === 'Control'
            };

            // Prevent PrintScreen
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText("").catch(() => { });
                }
                triggerBlackout();
                logViolation('PrintScreen');
                showToast("Skrinshot qilish taqiqlangan!");
                return;
            }

            // Prevent common screenshot/copy shortcuts
            const forbiddenKeys = ['c', 'x', 's', 'p', 'u', 'a'];
            const isForbiddenKey = forbiddenKeys.includes(e.key.toLowerCase());

            // Windows/Mac Screenshot Shortcuts
            // Win + Shift + S (Windows) or Cmd + Shift + S / 4 / 3 (Mac)
            const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3' || e.key.toLowerCase() === 's');
            const isWinScreenshot = (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') ||
                (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's');

            if (isMacScreenshot || isWinScreenshot) {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText("").catch(() => { });
                }
                triggerBlackout();
                logViolation(isWinScreenshot ? 'Windows Snipping Tool (Win+Shift+S)' : 'Mac Screenshot Shortcut');
                showToast("Skrinshot qilish taqiqlangan!");
            }

            if (
                (e.ctrlKey && isForbiddenKey && !e.altKey && !e.shiftKey) ||
                (e.metaKey && isForbiddenKey && !e.shiftKey) ||
                (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
                e.key === 'F12' ||
                e.key === 'F11'
            ) {
                if (e.key === 'F11' || e.key === 'F12') {
                    logViolation(`Forbidden Functional Key: ${e.key}`);
                }
                e.preventDefault();
                e.stopPropagation();
                showToast("Bu amal taqiqlangan!");
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            modifiersRef.current = {
                meta: e.metaKey,
                shift: e.shiftKey,
                ctrl: e.ctrlKey
            };

            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                triggerBlackout();
                logViolation('PrintScreen');
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            showToast("Nusxa olish taqiqlangan!");
        };

        const handleBlur = () => {
            setIsWarningActive(true);
            // If Win + Shift were being held when window blurred, it's almost certainly Snipping Tool
            if (modifiersRef.current.meta && modifiersRef.current.shift) {
                logViolation('Windows Snipping Tool (Win+Shift+S)');
            }
        };

        const handleFocus = () => {
            setIsWarningActive(false);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsWarningActive(true);
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCopy);
        document.addEventListener('dragstart', (e) => e.preventDefault());
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Inject styles
        const style = document.createElement('style');
        style.id = 'screenshot-protection-styles';
        style.innerHTML = `
            body {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }
            img {
                pointer-events: none !important;
                -webkit-user-drag: none !important;
            }
            @media print {
                body { display: none !important; }
            }
            .protection-blur-overlay {
                backdrop-filter: blur(20px);
                background: rgba(0,0,0,0.8);
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                text-align: center;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCopy);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            const injectedStyle = document.getElementById('screenshot-protection-styles');
            if (injectedStyle) injectedStyle.remove();
        };
    }, [isActuallyEnabled, logViolation, showToast, triggerBlackout]);

    if (!isActuallyEnabled) return null;

    const watermarkText = userName ? `${userName} | ${userId || ''}` : 'Buxgaltersiz.uz';

    return (
        <>
            {/* Blackout effect for immediate deterrent */}
            {isBlackout && (
                <div className="fixed inset-0 z-[1000000] bg-black flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-white text-4xl font-bold mb-4">SKRINSHOT TAQIQLANGAN!</h2>
                        <p className="text-gray-400">Ushbu harakat tizim tomonidan qayd etildi.</p>
                    </div>
                </div>
            )}

            {/* Blur Overlay when window loses focus */}
            {isWarningActive && !isBlackout && (
                <div className="protection-blur-overlay">
                    <div className="max-w-md">
                        <h2 className="text-white text-2xl font-bold mb-2">Sahifa himoyalangan</h2>
                        <p className="text-gray-300">Ko'rishni davom ettirish uchun ushbu oynaga qayting.</p>
                    </div>
                </div>
            )}
        </>
    );
}
