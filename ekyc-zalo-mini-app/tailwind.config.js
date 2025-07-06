module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  purge: {
    enabled: true,
    content: ["./src/**/*.{js,jsx,ts,tsx,vue}"],
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ["Roboto Mono", "monospace"],
      },
      colors: {
        neutral: {
          100: '#F8F8FC',
          200: '#F3F3F7',
          // 300: '#DEE2E6',
          // 400: '#CED4DA',
          // 500: '#ADB5BD',
          // 600: '#6C757D',
          700: '#82869E',
          // 800: '#343A40',
          900: '#1B1D29',
        },
        primary: '#FF9539'
      },
    },
  },
};
