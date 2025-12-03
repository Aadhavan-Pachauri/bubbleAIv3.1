
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRightIcon, 
    SparklesIcon, 
    UserGroupIcon, 
    CpuChipIcon, 
    BoltIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { AuthPage } from '../auth/AuthPage';
import { useAuth } from '../../contexts/AuthContext';
import AuroraCanvas from '../ui/AuroraCanvas';

const Header: React.FC<{ onAuthClick: () => void }> = ({ onAuthClick }) => (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-2">
            <span className="text-2xl">🫧</span>
            <span className="text-lg font-bold tracking-tight text-white">Bubble AI</span>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onAuthClick}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
                Log in
            </button>
            <button 
                onClick={onAuthClick}
                className="px-4 py-2 text-sm font-medium text-black bg-white rounded-full hover:bg-gray-200 transition-colors"
            >
                Sign up
            </button>
        </div>
    </header>
);

export const WelcomePage: React.FC = () => {
  const { continueAsGuest } = useAuth();
  const [isAuthVisible, setAuthVisible] = useState(false);
  
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-white/20">
        
        {/* Background Gradients & Aurora */}
        <div className="absolute inset-0 z-0 opacity-40">
            <AuroraCanvas />
        </div>
        
        {/* Additional dark overlay to ensure text contrast */}
        <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none" />

        <Header onAuthClick={() => setAuthVisible(true)} />

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-4xl mx-auto space-y-8 flex flex-col items-center"
            >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 backdrop-blur-md mb-2">
                    <SparklesIcon className="w-3 h-3 text-yellow-400" />
                    <span>New: Guest Mode Available</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
                    Your intelligent partner <br /> for everything.
                </h1>

                {/* Subtitle */}
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Chat, brainstorm, and build with advanced AI models. 
                    <br className="hidden md:block" />
                    Experience the power of Bubble AI instantly, no account needed.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
                    <button
                        onClick={continueAsGuest}
                        className="group relative flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-black bg-white rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto min-w-[200px] shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <span>Start Chatting</span>
                        <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    
                    <button
                        onClick={() => setAuthVisible(true)}
                        className="flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all w-full sm:w-auto min-w-[200px]"
                    >
                        Sign In
                    </button>
                </div>

                {/* Feature Pills */}
                <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8 text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                        <BoltIcon className="w-6 h-6 text-gray-400" />
                        <span>Instant Answers</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <CpuChipIcon className="w-6 h-6 text-gray-400" />
                        <span>Advanced Models</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-gray-400" />
                        <span>Co-Creator Tools</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
                        <span>Voice Mode</span>
                    </div>
                </div>

            </motion.div>
        </main>

        <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-600 z-10 pointer-events-none">
            &copy; {new Date().getFullYear()} Bubble AI Labs. All rights reserved.
        </footer>

        <AnimatePresence>
            {isAuthVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setAuthVisible(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <AuthPage />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
