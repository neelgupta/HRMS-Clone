"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/theme-context";

function ThemeToggleIcon({ theme, isDark }: { theme: "light" | "dark"; isDark: boolean }) {
  if (isDark) {
    return (
      <svg
        className="absolute inset-0 w-6 h-6 text-indigo-400 transition-all duration-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg
      className="absolute inset-0 w-6 h-6 text-amber-500 transition-all duration-300"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTheme = mounted ? theme : "light";

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        {mounted ? (
          <>
            <span
              className={`absolute inset-0 transition-all duration-300 ${
                displayTheme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
              }`}
            >
              <ThemeToggleIcon theme={displayTheme} isDark={true} />
            </span>
            <span
              className={`absolute inset-0 transition-all duration-300 ${
                displayTheme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
              }`}
            >
              <ThemeToggleIcon theme={displayTheme} isDark={false} />
            </span>
          </>
        ) : (
          <span className="absolute inset-0">
            <ThemeToggleIcon theme="light" isDark={false} />
          </span>
        )}
      </div>
    </button>
  );
}

export function ThemeToggleLarge() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTheme = mounted ? theme : "light";

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <div className="relative w-6 h-6">
        {mounted ? (
          <>
            <span
              className={`absolute inset-0 transition-all duration-300 ${
                displayTheme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
              }`}
            >
              <ThemeToggleIcon theme={displayTheme} isDark={true} />
            </span>
            <span
              className={`absolute inset-0 transition-all duration-300 ${
                displayTheme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
              }`}
            >
              <ThemeToggleIcon theme={displayTheme} isDark={false} />
            </span>
          </>
        ) : (
          <span className="absolute inset-0">
            <ThemeToggleIcon theme="light" isDark={false} />
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {displayTheme === "light" ? "Dark Mode" : "Light Mode"}
      </span>
    </button>
  );
}
