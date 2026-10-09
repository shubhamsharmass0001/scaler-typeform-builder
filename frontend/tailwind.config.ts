import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          hover: "var(--bg-surface-hover)",
          active: "var(--bg-surface-active)",
          subtle: "var(--bg-surface-subtle)",
        },
        card: {
          DEFAULT: "var(--bg-card)",
          hover: "var(--bg-card-hover)",
        },
        muted: {
          DEFAULT: "var(--bg-muted)",
          hover: "var(--bg-muted-hover)",
        },
        input: "var(--bg-input)",
        modal: "var(--bg-modal)",
        drawer: "var(--bg-drawer)",
        popover: "var(--bg-popover)",
        badge: "var(--bg-badge)",
        skeleton: "var(--bg-skeleton)",
        sidebar: "var(--bg-sidebar)",
        backdrop: "var(--bg-backdrop)",
        tooltip: "var(--bg-tooltip)",

        // Buttons & Brands
        primary: {
          DEFAULT: "var(--bg-btn-primary)",
          hover: "var(--bg-btn-primary-hover)",
          foreground: "var(--text-btn-primary)",
        },
        brand: {
          plan: "var(--bg-brand-plan)",
          "plan-hover": "var(--bg-brand-plan-hover)",
          "plan-text": "var(--text-brand-plan)",
        },
        avatar: {
          bg: "var(--bg-avatar)",
          text: "var(--text-avatar)",
        },

        // Text
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
          inverse: "var(--text-inverse)",
        },

        // Borders
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
          dashed: "var(--border-dashed)",
        },

        // Status
        status: {
          success: "var(--status-success)",
          "success-bg": "var(--status-success-bg)",
          "success-border": "var(--status-success-border)",
          warning: "var(--status-warning)",
          "warning-bg": "var(--status-warning-bg)",
          "warning-border": "var(--status-warning-border)",
          error: "var(--status-error)",
          "error-bg": "var(--status-error-bg)",
          "error-border": "var(--status-error-border)",
        },

        // Question Type Badges
        qbadge: {
          "short-text-bg": "var(--badge-short-text-bg)",
          "short-text-text": "var(--badge-short-text-text)",
          "long-text-bg": "var(--badge-long-text-bg)",
          "long-text-text": "var(--badge-long-text-text)",
          "email-bg": "var(--badge-email-bg)",
          "email-text": "var(--badge-email-text)",
          "choice-bg": "var(--badge-choice-bg)",
          "choice-text": "var(--badge-choice-text)",
          "dropdown-bg": "var(--badge-dropdown-bg)",
          "dropdown-text": "var(--badge-dropdown-text)",
          "number-bg": "var(--badge-number-bg)",
          "number-text": "var(--badge-number-text)",
          "yesno-bg": "var(--badge-yesno-bg)",
          "yesno-text": "var(--badge-yesno-text)",
          "rating-bg": "var(--badge-rating-bg)",
          "rating-text": "var(--badge-rating-text)",
          "upload-bg": "var(--badge-upload-bg)",
          "upload-text": "var(--badge-upload-text)",
          "welcome-bg": "var(--badge-welcome-bg)",
          "welcome-text": "var(--badge-welcome-text)",
          "ending-bg": "var(--badge-ending-bg)",
          "ending-text": "var(--badge-ending-text)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": [
          "var(--font-page-title-size)",
          {
            lineHeight: "var(--font-page-title-line-height)",
            letterSpacing: "var(--font-page-title-tracking)",
            fontWeight: "var(--font-page-title-weight)",
          },
        ],
        "section-title": [
          "var(--font-section-title-size)",
          {
            lineHeight: "var(--font-section-title-line-height)",
            letterSpacing: "var(--font-section-title-tracking)",
            fontWeight: "var(--font-section-title-weight)",
          },
        ],
        "card-title": [
          "var(--font-card-title-size)",
          {
            lineHeight: "var(--font-card-title-line-height)",
            letterSpacing: "var(--font-card-title-tracking)",
            fontWeight: "var(--font-card-title-weight)",
          },
        ],
        body: [
          "var(--font-body-size)",
          {
            lineHeight: "var(--font-body-line-height)",
            letterSpacing: "var(--font-body-tracking)",
            fontWeight: "var(--font-body-weight)",
          },
        ],
        caption: [
          "var(--font-caption-size)",
          {
            lineHeight: "var(--font-caption-line-height)",
            letterSpacing: "var(--font-caption-tracking)",
            fontWeight: "var(--font-caption-weight)",
          },
        ],
        micro: [
          "var(--font-micro-size)",
          {
            lineHeight: "var(--font-micro-line-height)",
            fontWeight: "var(--font-micro-weight)",
          },
        ],
        nano: [
          "var(--font-nano-size)",
          {
            lineHeight: "var(--font-nano-line-height)",
            fontWeight: "var(--font-nano-weight)",
          },
        ],
        "respondent-question": [
          "var(--font-respondent-question-size)",
          {
            lineHeight: "var(--font-respondent-question-line-height)",
            letterSpacing: "var(--font-respondent-question-tracking)",
            fontWeight: "var(--font-respondent-question-weight)",
          },
        ],
        "respondent-input": [
          "var(--font-respondent-input-size)",
          {
            lineHeight: "var(--font-respondent-input-line-height)",
            letterSpacing: "var(--font-respondent-input-tracking)",
            fontWeight: "var(--font-respondent-input-weight)",
          },
        ],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
        modal: "var(--shadow-modal)",
        tooltip: "var(--shadow-tooltip)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slide: "var(--duration-slide)",
      },
      transitionTimingFunction: {
        default: "var(--ease-default)",
        spring: "var(--ease-spring)",
      },
    },
  },
  plugins: [],
};

export default config;
