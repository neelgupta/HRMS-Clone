"use client";

import { ReactNode, useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";

type ThemeClass = {
  light: string;
  dark: string;
};

type ThemeAwareProps = {
  children: ReactNode;
  className?: string;
  lightClass?: string;
  darkClass?: string;
  wrapper?: "div" | "span" | "section" | "article" | "aside" | "header" | "footer";
};

export function useThemeClass(lightClass: string, darkClass: string): string {
  const { theme, mounted } = useTheme();
  return useMemo(() => {
    return mounted && theme === "dark" ? darkClass : lightClass;
  }, [mounted, theme, lightClass, darkClass]);
}

export function ThemeClass({
  children,
  className = "",
  lightClass,
  darkClass,
  wrapper: Wrapper = "div",
}: ThemeAwareProps) {
  const { theme, mounted } = useTheme();
  
  const combinedClass = useMemo(() => {
    if (!mounted) return `${className} ${lightClass || ""}`.trim();
    return `${className} ${theme === "dark" ? darkClass : lightClass}`.trim();
  }, [mounted, theme, className, lightClass, darkClass]);

  return <Wrapper className={combinedClass}>{children}</Wrapper>;
}

export function useIsDark(): boolean {
  const { theme, mounted } = useTheme();
  return mounted && theme === "dark";
}

export function useThemeColors() {
  const { theme, mounted } = useTheme();
  
  return useMemo(() => {
    if (!mounted) {
      return {
        isDark: false,
        bg: "bg-white",
        bgAlt: "bg-slate-50",
        text: "text-slate-900",
        textMuted: "text-slate-500",
        border: "border-slate-200",
        borderAlt: "border-slate-100",
        card: "bg-white",
        input: "bg-white border-slate-200",
      };
    }
    
    if (theme === "dark") {
      return {
        isDark: true,
        bg: "bg-slate-900",
        bgAlt: "bg-slate-800",
        text: "text-white",
        textMuted: "text-slate-400",
        border: "border-slate-700",
        borderAlt: "border-slate-800",
        card: "bg-slate-800",
        input: "bg-slate-800 border-slate-700",
      };
    }
    
    return {
      isDark: false,
      bg: "bg-white",
      bgAlt: "bg-slate-50",
      text: "text-slate-900",
      textMuted: "text-slate-500",
      border: "border-slate-200",
      borderAlt: "border-slate-100",
      card: "bg-white",
      input: "bg-white border-slate-200",
    };
  }, [mounted, theme]);
}
