/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Participant } from '../types';
import { sfx } from '../utils/audio';

interface WheelCanvasProps {
  participants: Participant[];
  theme: string;
  soundEnabled: boolean;
  onSpinComplete: (winner: Participant) => void;
  onSpinStart: () => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  participants,
  theme,
  soundEnabled,
  onSpinComplete,
  onSpinStart,
  isSpinning,
  setIsSpinning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const [pointerWiggle, setPointerWiggle] = useState<boolean>(false);
  
  // Track continuous rotation angle
  const [angle, setAngle] = useState(0);
  const stateRef = useRef({
    angle: 0,
    isSpinning: false,
    participants: participants,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.participants = participants;
  }, [participants]);

  // Keep internal spinning state track
  useEffect(() => {
    stateRef.current.isSpinning = isSpinning;
  }, [isSpinning]);

  // Handle Resize and Drawing
  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) return;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 20;
    const innerRadius = outerRadius - 16; // Outer rim border

    ctx.clearRect(0, 0, width, height);

    const len = participants.length;
    if (len === 0) {
      // Draw empty placeholder
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('請在名單輸入資料', cx, cy);
      return;
    }

    const arcSize = (2 * Math.PI) / len;

    // Draw Slices
    for (let i = 0; i < len; i++) {
      const startAngle = i * arcSize + currentAngle;
      const endAngle = (i + 1) * arcSize + currentAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerRadius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = participants[i].color;
      ctx.fill();

      // Soft slice divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Slice Text Label
      ctx.save();
      ctx.translate(cx, cy);
      // Center of the arc
      const textAngle = startAngle + arcSize / 2;
      ctx.rotate(textAngle);

      // Add elegant white text with shadow for supreme legibility
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Adapt fonts sizes based on slice count to avoid overlaps
      let fontSize = 18;
      if (len > 10) fontSize = 15;
      if (len > 20) fontSize = 12;
      if (len > 30) fontSize = 9;

      ctx.font = `bold ${fontSize}px "Inter", "Space Grotesk", system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncate name if it's too long
      let name = participants[i].name;
      const maxChars = len > 20 ? 8 : 12;
      if (name.length > maxChars) {
        name = name.slice(0, maxChars - 1) + '…';
      }

      ctx.fillText(name, innerRadius - 24, 0);
      ctx.restore();
    }

    // Draw Elegant Golden Outer Rim Frame
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e2e8f0'; // bright silver-white
    
    // Add linear metallic gradients to look realistic
    const rimGrad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    rimGrad.addColorStop(0, '#1e293b'); // Dark rim divider
    rimGrad.addColorStop(0.3, '#ecc94b'); // Luxurious Gold glow
    rimGrad.addColorStop(0.7, '#d69e2e'); // Deep gold
    rimGrad.addColorStop(1, '#744210'); // Dark bronze edge
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Draw Chasing Neon/Bulb Lights around Rim
    const numLights = Math.min(36, Math.max(16, len * 2));
    const lightsAngleOffset = (Date.now() / 320) % (2 * Math.PI); // speed of light chase
    for (let j = 0; j < numLights; j++) {
      const lightAngle = (j * (2 * Math.PI)) / numLights + lightsAngleOffset;
      const lx = cx + (outerRadius - 6) * Math.cos(lightAngle);
      const ly = cy + (outerRadius - 6) * Math.sin(lightAngle);

      // Alternating glowing bulbs colors
      const isLit = Math.floor(j + Date.now() / 250) % 2 === 0;

      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
      
      if (isLit) {
        ctx.fillStyle = '#fffbeb'; // Bright hot core
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f6e05e'; // Golden neon glow
      } else {
        ctx.fillStyle = '#8a5c00'; // Dim/unlit warm gold bulb
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset glow

    // Draw Golden Center Cap (Anchor)
    const centerRadius = outerRadius * 0.16;
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius);
    centerGrad.addColorStop(0, '#fef08a'); // Warm core
    centerGrad.addColorStop(0.5, '#ecc94b'); // Gold
    centerGrad.addColorStop(1, '#ca8a04'); // Metallic edge
    ctx.fillStyle = centerGrad;
    ctx.fill();

    // Small golden center ring stroke
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central core metallic screw head
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#fafaf9';
    ctx.fill();
  };

  // Redraw whenever the angle or participants list changes
  useEffect(() => {
    drawWheel(angle);
  }, [angle, participants]);

  // Handle Resize beautifully
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find the parent block wrapping element to break flexbox collapsing loop
      const parentBlock = canvas.closest('.max-w-lg');
      let width = 0;
      if (parentBlock && parentBlock.clientWidth > 0) {
        width = parentBlock.clientWidth;
      } else {
        const parent = canvas.parentElement;
        if (parent && parent.clientWidth > 0) {
          width = parent.clientWidth;
        }
      }

      // Fallback to window measurements if layout is initial/hidden
      if (width <= 0) {
        width = window.innerWidth - 32;
      }

      const size = Math.min(width, 480); // Restrict to elegant, high-contrast size
      canvas.width = size;
      canvas.height = size;
      drawWheel(stateRef.current.angle);
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Public Spin Handler API (Triggered by start drawing button)
  const spinToWinner = (winnerIndex: number) => {
    if (participants.length === 0 || stateRef.current.isSpinning) return;
    
    onSpinStart();
    setIsSpinning(true);

    const len = participants.length;
    const arcSize = (2 * Math.PI) / len;

    // Calculate start position
    const startAngle = stateRef.current.angle % (2 * Math.PI);

    // Calculate a target landing angle in the middle of the selected sector slice
    // Pointer is at -PI/2 (top). 
    // Target sector slice W under pointer must satisfy: (1.5*PI - targetAngle) === i * arcSize + arcSize/2
    // targetAngle = 1.5*PI - (i * arcSize + arcSize/2)
    let targetOffset = (1.5 * Math.PI) - (winnerIndex * arcSize + arcSize / 2);
    
    // Normalize targetOffset to [0, 2*PI)
    targetOffset = targetOffset % (2 * Math.PI);
    if (targetOffset < 0) {
      targetOffset += 2 * Math.PI;
    }

    // Add 6 to 9 robust full loops for dramatic aesthetic speed
    const totalSpins = 6 + Math.floor(Math.random() * 4);
    const targetAngleTotal = stateRef.current.angle - (startAngle) + (totalSpins * 2 * Math.PI) + targetOffset;

    const startTimestamp = performance.now();
    const duration = 5000; // 5 seconds satisfying ease-out curve

    let lastSegmentIdx = getSegmentIndexAtAngle(startAngle, len);
    let lastTickTime = 0;

    const animateSpin = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Quartic Ease-Out Equation: f(x) = 1 - (1 - x)^4
      // Highly accelerated starting, long physical rolling ending deceleration!
      const easeOutProgress = 1 - Math.pow(1 - progress, 4);
      const currentWheelAngle = startAngle + (targetAngleTotal - startAngle) * easeOutProgress;

      setAngle(currentWheelAngle);
      stateRef.current.angle = currentWheelAngle;

      // Draw current frame
      drawWheel(currentWheelAngle);

      // Physical interactive ticking sound effect
      const currentSegmentIdx = getSegmentIndexAtAngle(currentWheelAngle, len);
      if (currentSegmentIdx !== lastSegmentIdx) {
        lastSegmentIdx = currentSegmentIdx;

        if (soundEnabled) {
          const frameTime = performance.now();
          // Pitch-adapted click based on rotational speed index!
          const speedFactor = 1 - progress; // goes from 1.0 down to 0.0
          if (speedFactor > 0.01) {
            const timeDiff = frameTime - lastTickTime;
            // Limit audio clicks so they don't overlay into unpleasant buzzes at peak speeds
            if (timeDiff > 25) {
              const pitch = 300 + speedFactor * 450; // high frequency when speeding, warm & heavy when landing
              sfx.playTick(pitch, 0.05);

              // Visual pointer arrow spring kick/viggle!
              setPointerWiggle(true);
              setTimeout(() => setPointerWiggle(false), 30);

              lastTickTime = frameTime;
            }
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // Safe complete trigger
        setTimeout(() => {
          setIsSpinning(false);
          onSpinComplete(participants[winnerIndex]);
        }, 150);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  // Util to resolve sector index under top pointer
  const getSegmentIndexAtAngle = (rotAngle: number, totalSegments: number): number => {
    const delta = (2 * Math.PI) / totalSegments;
    // Normalized top pointer is at 1.5 * Math.PI (270 degrees on a standard grid)
    let physicalAngle = (1.5 * Math.PI - rotAngle) % (2 * Math.PI);
    if (physicalAngle < 0) {
      physicalAngle += 2 * Math.PI;
    }
    return Math.floor(physicalAngle / delta) % totalSegments;
  };

  // Expose spin action via click on center button of the wheel as well
  const handleCenterClick = () => {
    if (isSpinning || participants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * participants.length);
    spinToWinner(randomIndex);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      {/* Outer Glow Wrapper */}
      <div className="relative rounded-full p-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-2xl border border-slate-700/50">
        
        {/* Dynamic Canvas Container */}
        <div className="relative overflow-visible flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-full shadow-inner z-10 cursor-pointer block touch-none"
            onClick={handleCenterClick}
          />

          {/* Satisfying physical indicator pointer overlay at very top center */}
          <div
            ref={pointerRef}
            style={{
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className={`absolute z-30 pointer-events-none transition-transform duration-75 origin-top ${
              pointerWiggle ? 'rotate-12 scale-105' : 'rotate-0'
            }`}
          >
            {/* Elegant retro mechanical Arrow Container */}
            <div className="flex flex-col items-center drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
              {/* Pointing down triangle */}
              <svg
                width="34"
                height="44"
                viewBox="0 0 34 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 44L0 12h11V0h12v12h11L17 44z"
                  fill="url(#arrow_grad)"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Embedded shadow dot */}
                <circle cx="17" cy="18" r="4.5" fill="#facc15" />
                <defs>
                  <linearGradient id="arrow_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="60%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Hover Overlay Help Ring */}
          {!isSpinning && participants.length > 0 && (
            <div 
              onClick={handleCenterClick}
              className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/5 flex items-center justify-center z-20 cursor-pointer group transition-colors"
            >
              <div className="absolute opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all bg-slate-900/95 text-yellow-400 text-xs font-semibold tracking-wider font-display py-2 px-4 rounded-full border border-yellow-500/30 shadow-lg pointer-events-none uppercase">
                點擊轉盤開始
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Spin Trigger button inside canvas bounds */}
      <button
        id="btn_wheel_spin"
        disabled={isSpinning || participants.length === 0}
        onClick={handleCenterClick}
        className={`mt-6 inline-flex items-center gap-3 justify-center px-10 py-5 rounded-full text-lg font-bold tracking-widest transition-all duration-300 transform select-none ${
          isSpinning || participants.length === 0
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed scale-95'
            : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-display shadow-[0_4px_25px_rgba(239,68,68,0.45)] hover:shadow-[0_6px_35px_rgba(244,63,94,0.6)] cursor-pointer active:scale-95 border-b-4 border-red-800 active:border-b-0 hover:-translate-y-0.5'
        }`}
      >
        <span>🎯 START SPIN</span>
        {isSpinning && (
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
      </button>
    </div>
  );
};
