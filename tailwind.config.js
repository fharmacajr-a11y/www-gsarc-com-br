module.exports = {
  content: [
    "./index.html", "./404.html",
    "./sobre/**/*.html",
    "./servicos/**/*.html",
    "./modelos/**/*.html",
    "./projetos/**/*.html",
    "./contato/**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0A1F44",
          DEFAULT: "#1464FF",
          light: "#79CBFF",
          ice: "#EEF6FF"
        }
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"]
      }
    }
  }
};
