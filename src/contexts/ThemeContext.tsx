import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeName = "emerald" | "ocean" | "sunset" | "purple" | "rose" | "gold";
export type ColorMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "emerald",
  setTheme: () => {},
  colorMode: "dark",
  toggleColorMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const themes: Record<ThemeName, { label: string; primary: string; accent: string; preview: string }> = {
  emerald: { label: "Emerald", primary: "152 69% 45%", accent: "38 92% 55%", preview: "#2ecc71" },
  ocean: { label: "Ocean", primary: "210 100% 50%", accent: "190 90% 50%", preview: "#0080ff" },
  sunset: { label: "Sunset", primary: "15 85% 55%", accent: "35 95% 55%", preview: "#e05a2b" },
  purple: { label: "Purple", primary: "270 70% 55%", accent: "300 75% 55%", preview: "#8b5cf6" },
  rose: { label: "Rose", primary: "340 75% 55%", accent: "10 80% 55%", preview: "#e0437b" },
  gold: { label: "Gold", primary: "42 90% 50%", accent: "25 85% 50%", preview: "#d4a017" },
};

const themeVars: Record<ThemeName, Record<string, string>> = {
  emerald: {
    "--primary": "152 69% 45%",
    "--ring": "152 69% 45%",
    "--success": "152 69% 45%",
    "--accent": "38 92% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(152 69% 45%), hsl(152 69% 35%))",
    "--shadow-glow": "0 0 20px hsl(152 69% 45% / 0.15)",
    "--sidebar-primary": "152 69% 45%",
    "--sidebar-ring": "152 69% 45%",
  },
  ocean: {
    "--primary": "210 100% 50%",
    "--ring": "210 100% 50%",
    "--success": "210 100% 50%",
    "--accent": "190 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(210 100% 50%), hsl(220 90% 40%))",
    "--shadow-glow": "0 0 20px hsl(210 100% 50% / 0.15)",
    "--sidebar-primary": "210 100% 50%",
    "--sidebar-ring": "210 100% 50%",
  },
  sunset: {
    "--primary": "15 85% 55%",
    "--ring": "15 85% 55%",
    "--success": "15 85% 55%",
    "--accent": "35 95% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(15 85% 55%), hsl(5 80% 45%))",
    "--shadow-glow": "0 0 20px hsl(15 85% 55% / 0.15)",
    "--sidebar-primary": "15 85% 55%",
    "--sidebar-ring": "15 85% 55%",
  },
  purple: {
    "--primary": "270 70% 55%",
    "--ring": "270 70% 55%",
    "--success": "270 70% 55%",
    "--accent": "300 75% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(270 70% 55%), hsl(260 65% 42%))",
    "--shadow-glow": "0 0 20px hsl(270 70% 55% / 0.15)",
    "--sidebar-primary": "270 70% 55%",
    "--sidebar-ring": "270 70% 55%",
  },
  rose: {
    "--primary": "340 75% 55%",
    "--ring": "340 75% 55%",
    "--success": "340 75% 55%",
    "--accent": "10 80% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(340 75% 55%), hsl(350 70% 42%))",
    "--shadow-glow": "0 0 20px hsl(340 75% 55% / 0.15)",
    "--sidebar-primary": "340 75% 55%",
    "--sidebar-ring": "340 75% 55%",
  },
  gold: {
    "--primary": "42 90% 50%",
    "--ring": "42 90% 50%",
    "--success": "42 90% 50%",
    "--accent": "25 85% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(42 90% 50%), hsl(35 85% 40%))",
    "--shadow-glow": "0 0 20px hsl(42 90% 50% / 0.15)",
    "--sidebar-primary": "42 90% 50%",
    "--sidebar-ring": "42 90% 50%",
  },
};

function applyTheme(name: ThemeName) {
  const vars = themeVars[name];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem("app-theme") as ThemeName) || "emerald";
  });

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    return (localStorage.getItem("app-color-mode") as ColorMode) || "dark";
  });

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("app-theme", t);
    applyTheme(t);
  };

  const toggleColorMode = () => {
    const next = colorMode === "dark" ? "light" : "dark";
    setColorMode(next);
    localStorage.setItem("app-color-mode", next);
    applyColorMode(next);
  };

  useEffect(() => {
    applyTheme(theme);
    applyColorMode(colorMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
