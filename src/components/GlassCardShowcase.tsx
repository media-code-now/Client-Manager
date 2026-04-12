/**
 * AppleGlassCard Color Variants Showcase
 * 
 * Demonstrates the new color-tinted glassmorphism cards
 * for semantic feedback and visual hierarchy
 */

import { AppleGlassCard } from '@/components/apple/AppleComponents';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export function GlassCardShowcase() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Primary/Info Card */}
      <AppleGlassCard
        variant="primary"
        title="Information"
        subtitle="Primary blue tinted glass"
        icon={InformationCircleIcon}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Use this card for general information and primary actions.
        </p>
      </AppleGlassCard>

      {/* Success Card */}
      <AppleGlassCard
        variant="success"
        title="Success"
        subtitle="Green tinted glass"
        icon={CheckCircleIcon}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Perfect for successful operations and confirmations.
        </p>
      </AppleGlassCard>

      {/* Error Card */}
      <AppleGlassCard
        variant="error"
        title="Error"
        subtitle="Red tinted glass"
        icon={XCircleIcon}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Use for errors and critical issues that need attention.
        </p>
      </AppleGlassCard>

      {/* Warning Card */}
      <AppleGlassCard
        variant="warning"
        title="Warning"
        subtitle="Yellow tinted glass"
        icon={ExclamationTriangleIcon}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Display warnings and actions that need confirmation.
        </p>
      </AppleGlassCard>

      {/* Secondary Card */}
      <AppleGlassCard
        variant="secondary"
        title="Secondary"
        subtitle="Purple tinted glass"
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Use for secondary information and alternative actions.
        </p>
      </AppleGlassCard>

      {/* Tertiary Card */}
      <AppleGlassCard
        variant="tertiary"
        title="Tertiary"
        subtitle="Orange tinted glass"
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Perfect for tertiary information and accent content.
        </p>
      </AppleGlassCard>
    </div>
  );
}
