"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useStore } from "@/store/useStore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePathname } from "next/navigation";

export default function ContentProtection() {
    const { user, guestUser, currentTest } = useStore();
    const pathname = usePathname();
    const [isBlackout, setIsBlackout] = useState(false);
    const [isWarningActive, setIsWarningActive] = useState(false);
    const modifiersRef = useRef({ meta: false, shift: false, ctrl: false });

    const activeUser = user || guestUser;

    // Refs to track latest identity without re-attaching listeners
    const userRef = useRef({
        id: activeUser?.userId || 'anonymous',
        name: activeUser?.name || 'Anonymous User'
    });

    useEffect(() => {
        const getIdentity = () => {
            if (user) return { id: user.userId, name: user.name };
            if (guestUser) return { id: guestUser.userId, name: guestUser.name };

            // Absolute fallback from localStorage
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('guestUser');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        return { id: parsed.userId, name: parsed.name };
                    } catch (e) { }
                }
            }
            return { id: 'anonymous', name: 'Anonymous User' };
        };

        const identity = getIdentity();
        userRef.current = identity;
    }, [user, guestUser]);

    const logViolation = useCallback(async (type: string) => {
        try {
            await addDoc(collection(db, 'screenshotAttempts'), {
                userId: userRef.current.id,
                userName: userRef.current.name,
                testId: currentTest?.id || 'global_protection',
                testTitle: currentTest?.title || 'Global Site Protection',
                attemptType: type,
                timestamp: Timestamp.now(),
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
                screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown'
            });
        } catch (error) {
            console.error('Error logging screenshot attempt:', error);
        }
    }, [currentTest]);

    const triggerBlackout = useCallback(() => {
        setIsBlackout(true);
        setTimeout(() => setIsBlackout(false), 2000);
    }, []);

    const showWarningMessage = useCallback((msg: string = "Bu amal taqiqlangan!") => {
        const warning = document.createElement("div");
        warning.innerText = msg;
        warning.className = "content-protection-toast";
        warning.style.position = "fixed";
        warning.style.top = "20px";
        warning.style.left = "50%";
        warning.style.transform = "translateX(-50%)";
        warning.style.backgroundColor = "#ef4444";
        warning.style.color = "white";
        warning.style.padding = "12px 24px";
        warning.style.borderRadius = "9999px";
        warning.style.zIndex = "100000";
        warning.style.fontWeight = "600";
        warning.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        warning.style.transition = "all 0.3s ease";
        document.body.appendChild(warning);

        setTimeout(() => {
            warning.style.opacity = "0";
            warning.style.transform = "translateX(-50%) translateY(-20px)";
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }, []);

    useEffect(() => {
        // Disable protection for admins or on admin pages
        const isAdminPage = pathname?.startsWith('/admin');
        if (user?.role === 'admin' || isAdminPage) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            showWarningMessage("O'ng tugmani bosish taqiqlangan!");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.key === 'Meta' || e.key === 'OS' || e.key === 'Win';
            const isShift = e.shiftKey || e.key === 'Shift';
            const isCtrl = e.ctrlKey || e.key === 'Control';

            // Track modifier keys in Ref for reliable access in blur events
            modifiersRef.current = {
                meta: isMeta,
                shift: isShift,
                ctrl: isCtrl
            };

            // Prevent PrintScreen (PrtSc)
            if (e.key === "PrintScreen" || e.keyCode === 44 || e.key === "Snapshot") {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText("").catch(() => { });
                }
                triggerBlackout();
                showWarningMessage("Skrinshot qilish taqiqlangan!");
                logViolation('PrintScreen');
                return;
            }

            // Prevent common screenshot/copy shortcuts
            const forbiddenKeys = ["c", "x", "s", "p", "u", "a"];
            const isForbiddenKey = forbiddenKeys.includes(e.key.toLowerCase());

            // 2. Windows/Mac Screenshot Shortcuts (Win+Shift+S / Cmd+Shift+S)
            const isSKey = e.key.toLowerCase() === 's';
            const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3' || isSKey);
            const isWinScreenshot = (e.metaKey && e.shiftKey && isSKey) || (e.ctrlKey && e.shiftKey && isSKey);

            if (isMacScreenshot || isWinScreenshot) {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText("").catch(() => { });
                }
                triggerBlackout();
                logViolation('PrintScreen');
                showWarningMessage("Skrinshot qilish taqiqlangan!");
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // 3. Functional Keys (F11, F12)
            if (e.key === "F11" || e.key === "F12") {
                e.preventDefault();
                e.stopPropagation();
                triggerBlackout();
                logViolation(e.key === "F11" ? 'PrintScreen' : 'DevTools Attempt (F12)');
                showWarningMessage("Bu amal taqiqlangan!");
                return;
            }

            if (
                (e.ctrlKey && isForbiddenKey && !e.altKey && !e.shiftKey) ||
                (e.metaKey && isForbiddenKey && !e.shiftKey) ||
                (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
                e.stopPropagation();
                showWarningMessage("Bu amal taqiqlangan!");
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            modifiersRef.current = {
                meta: e.metaKey,
                shift: e.shiftKey,
                ctrl: e.ctrlKey
            };

            if (e.key === "PrintScreen" || e.keyCode === 44) {
                triggerBlackout();
                logViolation('PrintScreen'); // KeyUp version
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            showWarningMessage("Nusxa olish taqiqlangan!");
        };

        const handleBlur = () => {
            setIsWarningActive(true);

            // Very aggressive detection: If window blurs while Meta (Win/Cmd) is held,
            // or if both Meta and Shift were active, it's almost certainly a screenshot tool.
            if (modifiersRef.current.meta || (modifiersRef.current.meta && modifiersRef.current.shift)) {
                logViolation('PrintScreen');
            }
        };
        const handleFocus = () => setIsWarningActive(false);

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("cut", handleCopy);
        document.addEventListener("dragstart", (e) => e.preventDefault());
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        // CSS for protection
        const style = document.createElement("style");
        style.id = "content-protection-styles";
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
            .blur-overlay {
                backdrop-filter: blur(20px);
                background: rgba(0,0,0,0.8);
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("cut", handleCopy);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            const injectedStyle = document.getElementById("content-protection-styles");
            if (injectedStyle) injectedStyle.remove();
        };
    }, [triggerBlackout, showWarningMessage, logViolation, pathname, user?.role]);

    const isAdminPage = pathname?.startsWith('/admin');
    if (user?.role === 'admin' || isAdminPage) return null;

    return (
        <>
            {/* Blackout effect */}
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
                <div className="fixed inset-0 z-[999998] blur-overlay flex items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                        <h2 className="text-white text-2xl font-bold mb-2">Sahifa himoyalangan</h2>
                        <p className="text-gray-300">Ko'rishni davom ettirish uchun ushbu oynaga qayting.</p>
                    </div>
                </div>
            )}
        </>
    );
}
