'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

/**
 * Haptic Feedback Settings
 */
interface HapticSettings {
  enabled: boolean;
  intensity: number; // 0.5 to 2.0
  feedbackType: 'light' | 'medium' | 'heavy';
}

/**
 * Haptic Context
 */
interface HapticContextType {
  settings: HapticSettings;
  setEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: number) => void;
  setFeedbackType: (type: 'light' | 'medium' | 'heavy') => void;
  triggerFeedback: (type?: string, customIntensity?: number) => void;
  triggerLight: () => void;
  triggerMedium: () => void;
  triggerHeavy: () => void;
  triggerSelection: () => void;
  triggerSuccess: () => void;
  triggerError: () => void;
  triggerWarning: () => void;
}

const HapticContext = createContext<HapticContextType | undefined>(undefined);

/**
 * Haptic Provider Component
 */
export function HapticProvider({ children }: { children: ReactNode }) {
  const haptic = useHapticFeedback();
  const [settings, setSettings] = useState<HapticSettings>({
    enabled: true, // Enable by default on mobile
    intensity: 1.0,
    feedbackType: 'medium',
  });

  // Load saved settings from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('haptic-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
        } catch (error) {
          console.error('Failed to load haptic settings:', error);
        }
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback(
    (newSettings: Partial<HapticSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('haptic-settings', JSON.stringify(updated));
      }
    },
    [settings]
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings({ enabled });
    },
    [updateSettings]
  );

  const setIntensity = useCallback(
    (intensity: number) => {
      // Clamp intensity between 0.5 and 2.0
      const clamped = Math.max(0.5, Math.min(2.0, intensity));
      updateSettings({ intensity: clamped });
    },
    [updateSettings]
  );

  const setFeedbackType = useCallback(
    (type: 'light' | 'medium' | 'heavy') => {
      updateSettings({ feedbackType: type });
    },
    [updateSettings]
  );

  const triggerFeedback = useCallback(
    (type?: string, customIntensity?: number) => {
      if (!settings.enabled || !haptic.isSupported()) {
        return;
      }

      const intensity = customIntensity ?? settings.intensity;

      if (type) {
        haptic.trigger(type as any, intensity);
      } else {
        haptic.trigger(settings.feedbackType, intensity);
      }
    },
    [settings, haptic]
  );

  const triggerLight = useCallback(() => {
    triggerFeedback('light');
  }, [triggerFeedback]);

  const triggerMedium = useCallback(() => {
    triggerFeedback('medium');
  }, [triggerFeedback]);

  const triggerHeavy = useCallback(() => {
    triggerFeedback('heavy');
  }, [triggerFeedback]);

  const triggerSelection = useCallback(() => {
    triggerFeedback('selection');
  }, [triggerFeedback]);

  const triggerSuccess = useCallback(() => {
    triggerFeedback('success');
  }, [triggerFeedback]);

  const triggerError = useCallback(() => {
    triggerFeedback('error');
  }, [triggerFeedback]);

  const triggerWarning = useCallback(() => {
    triggerFeedback('warning');
  }, [triggerFeedback]);

  const value: HapticContextType = {
    settings,
    setEnabled,
    setIntensity,
    setFeedbackType,
    triggerFeedback,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerSuccess,
    triggerError,
    triggerWarning,
  };

  return <HapticContext.Provider value={value}>{children}</HapticContext.Provider>;
}

/**
 * Hook to use haptic feedback context
 */
export function useHaptic(): HapticContextType {
  const context = useContext(HapticContext);
  if (!context) {
    throw new Error('useHaptic must be used within HapticProvider');
  }
  return context;
}
