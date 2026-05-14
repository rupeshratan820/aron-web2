export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#05070d",
        panel: "#0c111d",
        cyan: "#40e6ff",
        violet: "#9d65ff",
        rose: "#ff4fb8"
      },
      boxShadow: {
        glow: "0 0 36px rgba(64, 230, 255, 0.22)",
        card: "0 28px 70px rgba(0, 0, 0, 0.42)"
      }
    }
  },
  plugins: []
};
