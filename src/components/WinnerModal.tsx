/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Participant } from '../types';
import { sfx } from '../utils/audio';
import { Sparkles, Trash2, RotateCcw, X } from 'lucide-react';

interface WinnerModalProps {
  winner: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onRemoveWinner: (id: string) => void;
  soundEnabled: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onClose,
  onRemoveWinner,
  soundEnabled,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      if (soundEnabled) {
        sfx.playSuccess();
      }
      
      // Fire beautiful canvas-confetti streamers
      triggerConfetti();
    }
  }, [isOpen, winner, soundEnabled]);

  const triggerConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      // Left and right streamers
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#facc15'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#facc15'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    // Initial blast
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    frame();
  };

  const handleRemove = () => {
    if (winner) {
      onRemoveWinner(winner.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            id="winner_modal_backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Celebratory Content Box */}
          <motion.div
            id="winner_modal_content"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/60 shadow-[0_20px_50px_rgba(245,158,11,0.25)] p-8 text-center z-13 flex flex-col items-center"
          >
            {/* Visual Header Sparkle Crown */}
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full blur-xl opacity-45 -translate-x-3 -translate-y-3"
              />
              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-medium tracking-wide text-slate-300 uppercase font-display select-none">
              CONGRATULATIONS!幸運得主
            </h3>

            {/* Huge Winner's Segment Visual Name Box */}
            <div className="w-full my-6 p-1 rounded-2xl bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500">
              <div className="bg-slate-950 rounded-xl px-4 py-8 flex flex-col items-center justify-center">
                <span 
                  className="text-4xl sm:text-5xl font-extrabold tracking-wider select-text"
                  style={{ 
                    color: winner.color, 
                    textShadow: `0 0 15px ${winner.color}40, 0 4px 6px rgba(0,0,0,0.7)` 
                  }}
                >
                  {winner.name}
                </span>
                
                {/* Visual Label tag indicating slice color */}
                <div 
                  className="mt-3 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full text-white/90 shadow-sm"
                  style={{ backgroundColor: winner.color }}
                >
                  Lucky Sector Slice
                </div>
              </div>
            </div>

            {/* Explanatory subtitle */}
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed select-none">
              真是一場精彩的抽籤！恭喜獲得好運！您可以選擇將其移出名單，或保留著名單繼續下一輪抽籤。
            </p>

            {/* Operation Buttons Group */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Option to remove winner from lists */}
              <button
                id="btn_remove_winner"
                onClick={handleRemove}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 border border-slate-700 rounded-2xl text-slate-200 hover:text-white font-medium text-sm transition-all shadow-md group cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <span>將他移出名單</span>
              </button>

              {/* Keep in list & Close */}
              <button
                id="btn_close_winner"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 active:from-yellow-500 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-yellow-500/20 group cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>保留繼續抽籤</span>
              </button>
            </div>

            {/* Top Right Close Anchor with subtle clickability */}
            <button
              id="btn_close_modal_x"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
