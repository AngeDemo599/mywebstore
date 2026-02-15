import {
  StoreTheme,
  StoreStyle,
  DEFAULT_THEME,
  PRESET_SOUQFLOW,
  RADIUS_MAP,
  FONT_MAP,
  SHADOW_MAP,
} from "@/types/store";

// ── Legacy v1 helpers (kept for backward compat) ──

export function resolveTheme(theme: unknown): StoreTheme {
  if (!theme || typeof theme !== "object") return DEFAULT_THEME;

  const t = theme as Record<string, unknown>;
  return {
    primaryColor: typeof t.primaryColor === "string" ? t.primaryColor : DEFAULT_THEME.primaryColor,
    secondaryColor: typeof t.secondaryColor === "string" ? t.secondaryColor : DEFAULT_THEME.secondaryColor,
    backgroundColor: typeof t.backgroundColor === "string" ? t.backgroundColor : DEFAULT_THEME.backgroundColor,
    textColor: typeof t.textColor === "string" ? t.textColor : DEFAULT_THEME.textColor,
  };
}

export function themeToCSS(theme: StoreTheme): React.CSSProperties {
  return {
    "--theme-primary": theme.primaryColor,
    "--theme-secondary": theme.secondaryColor,
    "--theme-bg": theme.backgroundColor,
    "--theme-text": theme.textColor,
  } as React.CSSProperties;
}

// ── v2 Style Resolution ──

function isV2(theme: unknown): theme is StoreStyle {
  return !!theme && typeof theme === "object" && (theme as Record<string, unknown>)._v === 2;
}

/** Upgrade v1 4-color theme to full StoreStyle */
function upgradeV1(theme: StoreTheme): StoreStyle {
  return {
    ...PRESET_SOUQFLOW,
    preset: "custom",
    colors: {
      ...PRESET_SOUQFLOW.colors,
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      background: theme.backgroundColor,
      text: theme.textColor,
    },
  };
}

/** Always returns a full StoreStyle, auto-upgrading v1 if needed */
export function resolveStyle(theme: unknown): StoreStyle {
  if (!theme || typeof theme !== "object") return PRESET_SOUQFLOW;
  if (isV2(theme)) {
    // Ensure headerStyle exists (added after initial v2 release)
    if (!theme.layout.headerStyle) {
      return { ...theme, layout: { ...theme.layout, headerStyle: "classic" } };
    }
    return theme;
  }
  // v1 format
  const v1 = resolveTheme(theme);
  return upgradeV1(v1);
}

/** Convert StoreStyle to CSS custom properties for root div */
export function styleToCSS(style: StoreStyle): React.CSSProperties {
  return {
    "--theme-primary": style.colors.primary,
    "--theme-secondary": style.colors.secondary,
    "--theme-bg": style.colors.background,
    "--theme-text": style.colors.text,
    "--theme-text-muted": style.colors.textMuted,
    "--theme-surface": style.colors.surface,
    "--theme-border": style.colors.border,
    "--theme-accent": style.colors.accent,
    "--theme-btn-radius": RADIUS_MAP[style.buttons.radius] || "8px",
    "--theme-btn-shadow": SHADOW_MAP[style.buttons.shadow] || "none",
    "--theme-input-radius": RADIUS_MAP[style.form.inputRadius] || "8px",
    "--theme-font": FONT_MAP[style.typography.font] || FONT_MAP.system,
    "--theme-heading-weight": style.typography.headingWeight,
    "--theme-body-size": style.typography.bodySize === "sm" ? "14px" : style.typography.bodySize === "lg" ? "18px" : "16px",
    fontFamily: FONT_MAP[style.typography.font] || FONT_MAP.system,
    fontSize: style.typography.bodySize === "sm" ? "14px" : style.typography.bodySize === "lg" ? "18px" : "16px",
  } as React.CSSProperties;
}

/** Returns style objects/classes for buttons, inputs, cards, headings */
export function getStyleClasses(style: StoreStyle) {
  const btnRadius = RADIUS_MAP[style.buttons.radius] || "8px";
  const btnShadow = SHADOW_MAP[style.buttons.shadow] || "none";
  const inputRadius = RADIUS_MAP[style.form.inputRadius] || "8px";

  // Button base style
  const buttonStyle: React.CSSProperties = {
    borderRadius: btnRadius,
    boxShadow: btnShadow,
    textTransform: style.buttons.uppercase ? "uppercase" : "none",
    letterSpacing: style.buttons.uppercase ? "0.5px" : "normal",
    fontWeight: 600,
  };

  if (style.buttons.style === "gradient") {
    buttonStyle.background = `linear-gradient(135deg, ${style.colors.primary}, ${style.colors.accent || style.colors.secondary})`;
    buttonStyle.color = "#ffffff";
    buttonStyle.border = "none";
  } else if (style.buttons.style === "outline") {
    buttonStyle.background = "transparent";
    buttonStyle.color = style.colors.primary;
    buttonStyle.border = `2px solid ${style.colors.primary}`;
  } else if (style.buttons.style === "pill") {
    buttonStyle.background = style.colors.primary;
    buttonStyle.color = "#ffffff";
    buttonStyle.border = "none";
    buttonStyle.borderRadius = "9999px";
  } else {
    // filled
    buttonStyle.background = style.colors.primary;
    buttonStyle.color = "#ffffff";
    buttonStyle.border = "none";
  }

  // Input style
  const inputStyle: React.CSSProperties = {
    borderRadius: inputRadius,
  };

  if (style.form.inputStyle === "underline") {
    inputStyle.border = "none";
    inputStyle.borderBottom = `2px solid ${style.colors.border}`;
    inputStyle.borderRadius = "0";
    inputStyle.background = "transparent";
  } else if (style.form.inputStyle === "filled") {
    inputStyle.border = "none";
    inputStyle.background = style.colors.surface;
  } else {
    inputStyle.border = `1px solid ${style.colors.border}`;
    inputStyle.background = "#ffffff";
  }

  // Card style
  const cardStyle: React.CSSProperties = {};
  if (style.layout.cardStyle === "shadow") {
    cardStyle.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    cardStyle.border = "none";
    cardStyle.borderRadius = "12px";
  } else if (style.layout.cardStyle === "bordered") {
    cardStyle.border = `1px solid ${style.colors.border}`;
    cardStyle.borderRadius = "8px";
  } else if (style.layout.cardStyle === "glass") {
    cardStyle.background = "rgba(255,255,255,0.7)";
    cardStyle.backdropFilter = "blur(12px)";
    cardStyle.border = `1px solid rgba(255,255,255,0.3)`;
    cardStyle.borderRadius = "16px";
    cardStyle.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
  } else {
    // flat
    cardStyle.border = "none";
    cardStyle.borderRadius = "8px";
    cardStyle.background = style.colors.surface;
  }

  // Image aspect ratio
  const aspectMap = { square: "1/1", video: "16/9", portrait: "3/4" };
  const imageAspect = aspectMap[style.layout.imageAspect] || "16/9";

  // Heading style
  const headingStyle: React.CSSProperties = {
    fontWeight: Number(style.typography.headingWeight) || 700,
  };

  // Summary style
  const summaryCardStyle: React.CSSProperties = { borderRadius: "12px" };
  if (style.form.summaryStyle === "bordered") {
    summaryCardStyle.border = `1px solid ${style.colors.border}`;
    summaryCardStyle.background = "transparent";
  } else if (style.form.summaryStyle === "minimal") {
    summaryCardStyle.border = "none";
    summaryCardStyle.background = "transparent";
    summaryCardStyle.padding = "0";
  } else {
    // card
    summaryCardStyle.background = style.colors.surface;
    summaryCardStyle.border = `1px solid ${style.colors.border}`;
  }

  return {
    buttonStyle,
    inputStyle,
    cardStyle,
    imageAspect,
    headingStyle,
    summaryCardStyle,
  };
}

/** Google Font URL for <link> tag (returns null for "system") */
export function getFontUrl(font: string): string | null {
  const fontUrls: Record<string, string> = {
    cairo: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap",
    inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
    tajawal: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap",
  };
  return fontUrls[font] || null;
}
