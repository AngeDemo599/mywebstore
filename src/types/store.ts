// ── Legacy v1 theme (backward compat) ──
export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export const DEFAULT_THEME: StoreTheme = {
  primaryColor: "#4f46e5",
  secondaryColor: "#818cf8",
  backgroundColor: "#ffffff",
  textColor: "#111827",
};

// ── v2 StoreStyle ──
export interface StoreStyle {
  _v: 2;
  preset: "souqflow" | "corporate" | "ecommerce" | "custom";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    textMuted: string;
    surface: string;
    border: string;
    accent: string;
  };
  buttons: {
    style: "filled" | "gradient" | "outline" | "pill";
    radius: "none" | "sm" | "md" | "lg" | "full";
    shadow: "none" | "sm" | "md" | "lg";
    uppercase: boolean;
  };
  form: {
    inputStyle: "default" | "underline" | "filled";
    inputRadius: "none" | "sm" | "md" | "lg";
    summaryStyle: "card" | "minimal" | "bordered";
  };
  layout: {
    cardStyle: "flat" | "shadow" | "bordered" | "glass";
    imageAspect: "square" | "video" | "portrait";
    coverStyle: "gradient" | "blur" | "solid" | "wave";
    headerStyle: "classic" | "centered" | "banner" | "minimal" | "hero";
    productGrid: 2 | 3;
  };
  typography: {
    font: "system" | "cairo" | "inter" | "tajawal";
    headingWeight: "600" | "700" | "800" | "900";
    bodySize: "sm" | "base" | "lg";
  };
}

// ── Mapping constants ──
export const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "16px",
  full: "9999px",
};

export const FONT_MAP: Record<string, string> = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  cairo: "'Cairo', sans-serif",
  inter: "'Inter', sans-serif",
  tajawal: "'Tajawal', sans-serif",
};

export const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.07)",
  lg: "0 10px 25px rgba(0,0,0,0.12)",
};

// ── Presets ──
export const PRESET_SOUQFLOW: StoreStyle = {
  _v: 2,
  preset: "souqflow",
  colors: {
    primary: "#059669",
    secondary: "#84cc16",
    background: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    surface: "#f9fafb",
    border: "#e5e7eb",
    accent: "#10b981",
  },
  buttons: { style: "gradient", radius: "lg", shadow: "md", uppercase: false },
  form: { inputStyle: "default", inputRadius: "lg", summaryStyle: "card" },
  layout: { cardStyle: "glass", imageAspect: "video", coverStyle: "gradient", headerStyle: "centered", productGrid: 3 },
  typography: { font: "cairo", headingWeight: "700", bodySize: "base" },
};

export const PRESET_CORPORATE: StoreStyle = {
  _v: 2,
  preset: "corporate",
  colors: {
    primary: "#1e40af",
    secondary: "#3b82f6",
    background: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    surface: "#f8fafc",
    border: "#e2e8f0",
    accent: "#2563eb",
  },
  buttons: { style: "filled", radius: "sm", shadow: "sm", uppercase: false },
  form: { inputStyle: "default", inputRadius: "sm", summaryStyle: "bordered" },
  layout: { cardStyle: "bordered", imageAspect: "video", coverStyle: "blur", headerStyle: "classic", productGrid: 3 },
  typography: { font: "inter", headingWeight: "600", bodySize: "base" },
};

export const PRESET_ECOMMERCE: StoreStyle = {
  _v: 2,
  preset: "ecommerce",
  colors: {
    primary: "#ea580c",
    secondary: "#f97316",
    background: "#ffffff",
    text: "#1c1917",
    textMuted: "#78716c",
    surface: "#fafaf9",
    border: "#e7e5e4",
    accent: "#f59e0b",
  },
  buttons: { style: "filled", radius: "md", shadow: "lg", uppercase: true },
  form: { inputStyle: "filled", inputRadius: "md", summaryStyle: "card" },
  layout: { cardStyle: "shadow", imageAspect: "square", coverStyle: "gradient", headerStyle: "hero", productGrid: 2 },
  typography: { font: "tajawal", headingWeight: "800", bodySize: "lg" },
};
