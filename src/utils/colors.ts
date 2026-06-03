/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const getSliceColor = (index: number, total: number, paletteType: string): string => {
  const totalSafe = Math.max(1, total);
  
  switch (paletteType) {
    case 'pastel': {
      // Creamy high saturation light pastels (extremely bright and friendly)
      const hue = (index * (360 / totalSafe)) % 360;
      return `hsl(${hue}, 85%, 65%)`;
    }
    case 'neon': {
      // High frequency neon cyberpunk style
      const hue = (index * (362 / totalSafe)) % 360;
      return `hsl(${hue}, 100%, 55%)`;
    }
    case 'sunset': {
      // Yellow to vibrant warm red gradient flow
      const ratios = index / totalSafe;
      const hue = 5 + ratios * 55; // Red-Orange (5) to Orange-Yellow (60)
      return `hsl(${hue}, 100%, 50%)`;
    }
    case 'cool': {
      // Fresh icey mint and royalty violet shades
      const ratios = index / totalSafe;
      const hue = 165 + ratios * 105; // Emerald Menthol (165) to Midnight purple-indigo (270)
      return `hsl(${hue}, 90%, 55%)`;
    }
    case 'vibrant':
    default: {
      // Luxurious bright high-contrast curated digital candy paints
      const hexPalette = [
        '#f43f5e', // Rose
        '#3b82f6', // Indigo Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber Gold
        '#8b5cf6', // Indigo Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#14b8a6', // Teal
        '#a855f7', // Purple
        '#0ea5e9', // Light Blue
        '#84cc16', // Lime
        '#6366f1', // Indigo
        '#ec4899', // Deep fuschia
        '#fbbf24'  // Gold Yellow
      ];
      return hexPalette[index % hexPalette.length];
    }
  }
};
