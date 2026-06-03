/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Participant {
  id: string;
  name: string;
  weight: number; // For advanced setups, weight or equal chance
  color: string;  // Assigned slice color
}

export interface DrawHistoryItem {
  id: string;
  winnerName: string;
  timestamp: Date;
  removedFromList: boolean;
}

export interface WheelConfig {
  soundEnabled: boolean;
  theme: 'vibrant' | 'pastel' | 'neon' | 'sunset' | 'cool';
  spinDuration: number; // in seconds
  removeAfterDraw: boolean;
}
