'use client';

import React, { ComponentType } from 'react';
import { useHaptic } from '@/context/HapticContext';

/**
 * Apple iOS 26 Design Component Library
 * Reusable components following Apple's design language
 */

// ============================================================================
// APPLE CARD COMPONENT
// ============================================================================

interface AppleCardProps {
  title?: string;
  subtitle?: string;
  icon?: ComponentType<{ className: string }>;
  children?: React.ReactNode;
  glassmorphism?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function AppleCard({
  title,
  subtitle,
  icon: Icon,
  children,
  glassmorphism = true,
  className = '',
  onClick,
  interactive = false,
}: AppleCardProps) {
  const baseClasses =
    'rounded-2xl p-6 transition-all duration-300 border cursor-default';

  const glassClasses =
    'border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-white/30 dark:hover:border-white/20';

  const solidClasses =
    'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md dark:shadow-lg';

  const hoverClasses = interactive
    ? 'hover:shadow-lg dark:hover:shadow-xl active:scale-95'
    : '';

  return (
    <div
      className={`${baseClasses} ${glassmorphism ? glassClasses : solidClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {(title || Icon) && (
        <div className="flex items-start gap-4 mb-4">
          {Icon && <Icon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />}
          {title && (
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// APPLE GLASS CARD COMPONENT - Color-Tinted Glassmorphism
// ============================================================================

type GlassCardVariant = 'primary' | 'success' | 'error' | 'warning' | 'secondary' | 'tertiary' | 'default';

interface AppleGlassCardProps {
  title?: string;
  subtitle?: string;
  icon?: ComponentType<{ className: string }>;
  children?: React.ReactNode;
  variant?: GlassCardVariant;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function AppleGlassCard({
  title,
  subtitle,
  icon: Icon,
  children,
  variant = 'default',
  className = '',
  onClick,
  interactive = false,
}: AppleGlassCardProps) {
  const variantStyles = {
    primary: {
      bg: 'bg-gradient-to-br from-glass-blue-light to-glass-blue-lighter dark:from-glass-blue-light/50 dark:to-glass-blue-lighter/25',
      border: 'border-glass-blue',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    success: {
      bg: 'bg-gradient-to-br from-glass-green-light to-glass-green-lighter dark:from-glass-green-light/50 dark:to-glass-green-lighter/25',
      border: 'border-glass-green',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-gradient-to-br from-glass-red-light to-glass-red-lighter dark:from-glass-red-light/50 dark:to-glass-red-lighter/25',
      border: 'border-glass-red',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-gradient-to-br from-glass-yellow-light to-glass-yellow-lighter dark:from-glass-yellow-light/50 dark:to-glass-yellow-lighter/25',
      border: 'border-glass-yellow',
      iconColor: 'text-yellow-600 dark:text-yellow-600',
    },
    secondary: {
      bg: 'bg-gradient-to-br from-glass-purple-light to-glass-purple-lighter dark:from-glass-purple-light/50 dark:to-glass-purple-lighter/25',
      border: 'border-glass-purple',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    tertiary: {
      bg: 'bg-gradient-to-br from-glass-orange-light to-glass-orange-lighter dark:from-glass-orange-light/50 dark:to-glass-orange-lighter/25',
      border: 'border-glass-orange',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    default: {
      bg: 'bg-white/30 dark:bg-white/5',
      border: 'border-white/20 dark:border-white/10',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
  };

  const style = variantStyles[variant];

  const baseClasses =
    'rounded-2xl p-6 transition-all duration-300 border cursor-default';

  const glassClasses = `${style.bg} ${style.border} backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:shadow-xl`;

  const hoverClasses = interactive
    ? 'hover:border-opacity-80 active:scale-95'
    : '';

  return (
    <div
      className={`${baseClasses} ${glassClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {(title || Icon) && (
        <div className="flex items-start gap-4 mb-4">
          {Icon && <Icon className={`w-8 h-8 ${style.iconColor} flex-shrink-0 mt-1`} />}
          {title && (
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// APPLE BUTTON COMPONENT


interface AppleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: ComponentType<{ className: string }>;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function AppleButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  isLoading = false,
  disabled,
  className = '',
  onClick,
  ...props
}: AppleButtonProps) {
  const haptic = useHaptic();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptic.triggerLight();
    onClick?.(e);
  };

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:hover:bg-blue-500',
    secondary:
      'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700',
    glass:
      'border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/[0.05] backdrop-blur-md hover:bg-white/30 dark:hover:bg-white/[0.1] text-slate-900 dark:text-slate-100',
    destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-6 py-2.5 text-base font-semibold',
    lg: 'px-8 py-3.5 text-lg font-semibold',
  };

  return (
    <button
      className={`
        rounded-full
        inline-flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      {children}
    </button>
  );
}

// ============================================================================
// APPLE INPUT COMPONENT
// ============================================================================

interface AppleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ComponentType<{ className: string }>;
  label?: string;
  error?: string;
  glassmorphism?: boolean;
  helperText?: string;
}

export function AppleInput({
  icon: Icon,
  label,
  error,
  glassmorphism = false,
  helperText,
  className = '',
  ...props
}: AppleInputProps) {
  const baseClasses =
    'w-full rounded-lg px-4 py-2.5 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  const iconPadding = Icon ? 'pl-10' : '';

  const inputClasses = glassmorphism
    ? `${baseClasses} border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/[0.05] backdrop-blur-md text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400`
    : `${baseClasses} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`;

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        )}

        <input className={`${inputClasses} ${iconPadding} ${className}`} {...props} />
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// APPLE HEADER COMPONENT
// ============================================================================

interface AppleHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backButton?: () => void;
}

export function AppleHeader({
  title,
  subtitle,
  actions,
  backButton,
}: AppleHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {backButton && (
            <AppleButton
              variant="secondary"
              size="sm"
              onClick={backButton}
              aria-label="Go back"
            >
              ←
            </AppleButton>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// ============================================================================
// APPLE SWITCH COMPONENT
// ============================================================================

interface AppleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function AppleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: AppleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-7 w-12 items-center rounded-full
          transition-colors duration-200
          ${checked ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`
            inline-block h-6 w-6 transform rounded-full bg-white shadow-lg
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && <label className="text-base text-slate-900 dark:text-slate-100">{label}</label>}
    </div>
  );
}

// ============================================================================
// APPLE TAB BAR COMPONENT
// ============================================================================

interface AppleTabBarTab {
  id: string;
  label: string;
  icon: ComponentType<{ className: string }>;
  badge?: number;
}

interface AppleTabBarProps {
  tabs: AppleTabBarTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  position?: 'bottom' | 'top';
}

export function AppleTabBar({
  tabs,
  activeTab,
  onTabChange,
  position = 'bottom',
}: AppleTabBarProps) {
  const positionClasses =
    position === 'bottom'
      ? 'fixed bottom-0 left-0 right-0'
      : 'fixed top-0 left-0 right-0';

  return (
    <nav
      className={`${positionClasses} z-40 border-${position === 'bottom' ? 't' : 'b'} border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-2xl`}
    >
      <div className="max-w-7xl mx-auto px-4 flex h-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-200 group"
              aria-selected={isActive}
              role="tab"
            >
              {isActive && (
                <div className="absolute top-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}

              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-xs transition-colors ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================================
// APPLE BADGE COMPONENT
// ============================================================================

interface AppleBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  size?: 'sm' | 'md';
  icon?: ComponentType<{ className: string }>;
}

export function AppleBadge({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
}: AppleBadgeProps) {
  const variants = {
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    success:
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning:
      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
}

// ============================================================================
// APPLE SKELETON LOADER
// ============================================================================

interface AppleSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'circle';
  className?: string;
}

export function AppleSkeleton({
  variant = 'text',
  className = '',
}: AppleSkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-2xl',
    avatar: 'h-12 w-12 rounded-full',
    circle: 'h-8 w-8 rounded-full',
  };

  return (
    <div
      className={`
        ${variants[variant]}
        animate-pulse
        bg-slate-200 dark:bg-slate-700
        ${className}
      `}
    />
  );
}

// ============================================================================
// APPLE EMPTY STATE
// ============================================================================

interface AppleEmptyStateProps {
  icon?: ComponentType<{ className: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AppleEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AppleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="mb-4">
          <Icon className="w-16 h-16 text-slate-400 dark:text-slate-600" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-base text-slate-600 dark:text-slate-400 text-center mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================================================
// APPLE PROGRESS INDICATOR
// ============================================================================

interface AppleProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function AppleProgress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
}: AppleProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'bg-blue-600',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div>
      <div
        className={`
          w-full rounded-full overflow-hidden
          bg-slate-200 dark:bg-slate-700
          ${sizes[size]}
        `}
      >
        <div
          className={`
            h-full transition-all duration-300
            ${variants[variant]}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          {percentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
}

export default {
  AppleCard,
  AppleGlassCard,
  AppleButton,
  AppleInput,
  AppleHeader,
  AppleSwitch,
  AppleTabBar,
  AppleBadge,
  AppleSkeleton,
  AppleEmptyState,
  AppleProgress,
};
