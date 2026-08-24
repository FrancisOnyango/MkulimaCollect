/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#1A5C35",
        "brand-dark": "#0F3D22",
        "brand-mid": "#246B40",
        "brand-light": "#E8F4EC",
        "brand-muted": "#F4F8F5",
        surface: "#FAFAFA",
        charcoal: "#1C1C1E",
        "charcoal-700": "#3A3A3C",
        "charcoal-500": "#636366",
        "charcoal-300": "#AEAEB2",
        "charcoal-100": "#E5E5EA",
        "charcoal-50": "#F2F2F7",
        "amber-field": "#B45309",
        "amber-bg": "#FEF3C7",
        "red-field": "#B91C1C",
        "red-bg": "#FEE2E2",
      },
      fontFamily: {
        sans: ["InstrumentSans_400Regular", "system-ui", "sans-serif"],
        "sans-medium": ["InstrumentSans_500Medium"],
        "sans-semibold": ["InstrumentSans_600SemiBold"],
        mono: ["DMMono_400Regular", "monospace"],
        "mono-medium": ["DMMono_500Medium"],
      },
    },
  },
  plugins: [],
};
