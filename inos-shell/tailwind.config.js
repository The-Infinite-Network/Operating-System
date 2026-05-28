/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        inos: {
          // Ross Digital palette (Ultraviolet / Obsidian / Steel / Amber)
          bg: "#0B1F3A", // Obsidian Blue – deep base
          panel: "#11153A", // Slightly lighter panel tone
          border: "#B7BDC8", // Steel Silver
          text: "#F5F1E6", // Bone White
          muted: "#EAF2F9", // Glacial Ice
          accent: "#FFBF00", // Amber
        },
        ops: {
          sand: "#f6f3ec",
          clay: "#e9dfd1",
          ink: "#1b1b1f",
          muted: "#6b6b70",
          teal: "#1f8a7a",
          coral: "#f26c4f",
          dusk: "#0f2f2d",
          leaf: "#7fb069",
        },
      },
    },
  },
  plugins: [],
};
