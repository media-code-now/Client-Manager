'use client';

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  className?: string;
};

const buttonBase =
  "rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white active:translate-y-px dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:shadow-slate-900/20 dark:hover:bg-slate-900";

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={classNames(buttonBase, className)}
        aria-label="Toggle theme"
        disabled
      >
        <span className="flex items-center gap-2">
          <MoonIcon className="h-5 w-5" />
          <span>Theme</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={classNames(buttonBase, className)}
      aria-label="Toggle theme"
    >
      <span className="flex items-center gap-2">
        {theme === "dark" ? (
          <>
            <SunIcon className="h-5 w-5" />
            <span>Light</span>
          </>
        ) : (
          <>
            <MoonIcon className="h-5 w-5" />
            <span>Dark</span>
          </>
        )}
      </span>
    </button>
  );
}
