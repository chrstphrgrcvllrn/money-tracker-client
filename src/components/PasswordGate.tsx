import { useState } from "react";

const STORAGE_KEY = "moneyTrackerAccessGranted";
const SITE_PASSWORD = "000000";

const hasStoredAccess = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(hasStoredAccess);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input === SITE_PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Storage unavailable (private mode, etc.) — still grant this session.
      }
      setAuthorized(true);
      setError("");
    } else {
      setError("Incorrect password");
      setInput("");
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-page)]">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Money Tracker
            </h1>
            <p className="text-sm mt-1 text-[var(--text-secondary)]">
              Enter password to continue
            </p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="Password"
            className="w-full px-3 py-3 text-center tracking-[0.3em] border rounded-lg focus:border-[#C9A374]/50 outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-gray-600"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-3 rounded-lg"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
