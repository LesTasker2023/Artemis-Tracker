/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "hsl(var(--surface-primary))",
          secondary: "hsl(var(--surface-secondary))",
          neutral: "hsl(var(--surface-neutral))",
          interactive: "hsl(var(--surface-interactive))",
          clickable: "hsl(var(--surface-clickable))",
          accent: "hsl(var(--surface-accent))",
        },
        content: {
          primary: "hsl(var(--content-primary))",
          secondary: "hsl(var(--content-secondary))",
          muted: "hsl(var(--content-muted))",
        },
        border: {
          DEFAULT: "hsl(var(--border-default))",
          interactive: "hsl(var(--border-interactive))",
          muted: "hsl(var(--border-muted))",
        },
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          error: "hsl(var(--status-error))",
          info: "hsl(var(--status-info))",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
