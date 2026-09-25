import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import type { UseFormRegisterReturn } from "react-hook-form";

const inputClass =
  "w-full px-3 py-3 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30 outline-none";

type FieldProps = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete: string;
  autoFocus?: boolean;
};

function FieldShell({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ id, label, registration, error, autoComplete, autoFocus }: FieldProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        type="text"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...registration}
      />
    </FieldShell>
  );
}

export function PasswordField({ id, label, registration, error, autoComplete, autoFocus }: FieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} pr-11`}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 outline-none"
        >
          {visible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
    </FieldShell>
  );
}
