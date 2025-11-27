'use client';

import React from 'react';

export const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-slate-950">
            {/* Moving Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

            {/* Subtle Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80" />
        </div>
    );
};
