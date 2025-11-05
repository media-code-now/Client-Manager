'use client';

type Option = {
  id: string;
  label: string;
};

type SegmentedControlProps = {
  options: Option[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const SegmentedControl = ({ options, activeId, onChange, className }: SegmentedControlProps) => {
  return (
    <div
      className={classNames(
        "inline-flex rounded-full border border-white/60 bg-white/80 p-1 shadow-inner shadow-white/60 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-950/30",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={classNames(
              "rounded-full px-4 py-2 text-sm font-medium capitalize transition",
              isActive
                ? "bg-white text-slate-900 shadow-lg shadow-slate-900/10 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/30"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
