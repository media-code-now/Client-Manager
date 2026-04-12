/**
 * Custom hook for triggering haptic feedback on user interactions
 * Uses the Vibration API available on most mobile devices and some desktop devices
 * 
 * Haptic Types:
 * - light: Short, light vibration (10ms)
 * - medium: Medium vibration (20ms)
 * - heavy: Strong vibration (30ms)
 * - selection: Selection feedback pattern
 * - success: Success pattern (vibrate-pause-vibrate)
 * - error: Error pattern (rapid vibrations)
 * - warning: Warning pattern
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'warning' | 'impact';

interface HapticPattern {
  pattern: number | number[];
  duration?: number;
}

// Haptic feedback patterns
const HAPTIC_PATTERNS: Record<HapticType, HapticPattern> = {
  // Basic feedback
  light: { pattern: 10 },                              // 10ms light vibration
  medium: { pattern: 20 },                             // 20ms medium vibration
  heavy: { pattern: 30 },                              // 30ms heavy vibration
  
  // Selection/interaction feedback
  selection: { pattern: [10, 10, 10] },               // light-pause-light pattern
  
  // Status feedback
  success: { pattern: [0, 30, 50, 30] },              // vibrate-pause-vibrate pattern
  error: { pattern: [0, 30, 50, 30, 50, 30] },        // rapid vibration pattern for errors
  warning: { pattern: [0, 20, 30, 20] },              // warning pattern
  
  // Impact feedback (like pressing a button)
  impact: { pattern: 15 },                             // 15ms impact vibration
};

/**
 * Hook to trigger haptic feedback
 * @returns Object with methods to trigger different haptic patterns
 */
export function useHapticFeedback() {
  /**
   * Check if device supports vibration API
   */
  const isSupported = (): boolean => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  };

  /**
   * Trigger haptic feedback with specified pattern
   * @param type - Type of haptic feedback
   * @param intensity - Optional intensity multiplier (0.5 = half duration, 2 = double)
   */
  const trigger = (type: HapticType = 'medium', intensity: number = 1): void => {
    if (!isSupported()) {
      return;
    }

    const hapticData = HAPTIC_PATTERNS[type];
    if (!hapticData) {
      console.warn(`Unknown haptic type: ${type}`);
      return;
    }

    // Adjust pattern based on intensity
    let pattern = hapticData.pattern;
    if (typeof pattern === 'number') {
      pattern = Math.round(pattern * intensity);
    } else {
      pattern = pattern.map((p) => Math.round(p * intensity));
    }

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  /**
   * Light tap feedback - for subtle interactions
   */
  const light = (intensity?: number): void => trigger('light', intensity);

  /**
   * Medium feedback - default for most interactions
   */
  const medium = (intensity?: number): void => trigger('medium', intensity);

  /**
   * Heavy feedback - for important actions
   */
  const heavy = (intensity?: number): void => trigger('heavy', intensity);

  /**
   * Selection feedback - for selection/toggle actions
   */
  const selection = (intensity?: number): void => trigger('selection', intensity);

  /**
   * Success feedback - for successful operations
   */
  const success = (intensity?: number): void => trigger('success', intensity);

  /**
   * Error feedback - for errors and failures
   */
  const error = (intensity?: number): void => trigger('error', intensity);

  /**
   * Warning feedback - for warnings
   */
  const warning = (intensity?: number): void => trigger('warning', intensity);

  /**
   * Impact feedback - for physical actions
   */
  const impact = (intensity?: number): void => trigger('impact', intensity);

  /**
   * Stop vibration
   */
  const stop = (): void => {
    if (isSupported()) {
      try {
        navigator.vibrate(0);
      } catch (error) {
        console.error('Haptic stop error:', error);
      }
    }
  };

  return {
    isSupported,
    trigger,
    light,
    medium,
    heavy,
    selection,
    success,
    error,
    warning,
    impact,
    stop,
  };
}
