/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "tertiary": "#e9c400",
              "outline": "#908fa0",
              "secondary-fixed-dim": "#2fd9f4",
              "surface-variant": "#2d3449",
              "surface-container-high": "#222a3e",
              "surface-bright": "#31394e",
              "on-primary-container": "#0d0096",
              "secondary-container": "#00cbe6",
              "error": "#ffb4ab",
              "inverse-primary": "#494bd6",
              "on-error": "#690005",
              "primary-fixed-dim": "#c0c1ff",
              "primary-fixed": "#e1e0ff",
              "outline-variant": "#464554",
              "on-error-container": "#ffdad6",
              "background": "#0b1326",
              "on-primary-fixed-variant": "#2f2ebe",
              "on-secondary-container": "#00515d",
              "on-surface-variant": "#c7c4d7",
              "surface-container-lowest": "#060d20",
              "surface-dim": "#0b1326",
              "surface-container-low": "#131b2e",
              "inverse-on-surface": "#283044",
              "on-background": "#dbe2fd",
              "tertiary-fixed": "#ffe16d",
              "primary-container": "#8083ff",
              "secondary": "#5de6ff",
              "on-secondary": "#00363e",
              "error-container": "#93000a",
              "tertiary-fixed-dim": "#e9c400",
              "on-secondary-fixed-variant": "#004e5a",
              "on-tertiary-fixed-variant": "#544600",
              "on-primary-fixed": "#07006c",
              "inverse-surface": "#dbe2fd",
              "on-tertiary": "#3a3000",
              "surface": "#0b1326",
              "on-tertiary-fixed": "#221b00",
              "on-primary": "#1000a9",
              "surface-container": "#171f33",
              "secondary-fixed": "#a2eeff",
              "primary": "#c0c1ff",
              "surface-tint": "#c0c1ff",
              "tertiary-container": "#c9a900",
              "on-tertiary-container": "#4c3f00",
              "on-secondary-fixed": "#001f25",
              "on-surface": "#dbe2fd",
              "surface-container-highest": "#2d3449"
      },
      "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "2xl": "1.25rem",
              "3xl": "2rem",
              "full": "9999px"
      },
      "spacing": {
              "container-padding-desktop": "48px",
              "panel-gap": "16px",
              "unit": "8px",
              "gutter": "24px",
              "section-margin": "80px",
              "container-padding-mobile": "24px"
      },
      "fontFamily": {
              "label-md": [
                      "Plus Jakarta Sans"
              ],
              "label-sm": [
                      "Plus Jakarta Sans"
              ],
              "headline-lg": [
                      "Plus Jakarta Sans"
              ],
              "headline-lg-mobile": [
                      "Plus Jakarta Sans"
              ],
              "display-lg": [
                      "Outfit", "sans-serif"
              ],
              "body-lg": [
                      "Plus Jakarta Sans"
              ],
              "headline-xl": [
                      "Plus Jakarta Sans"
              ],
              "body-md": [
                      "Plus Jakarta Sans"
              ]
      },
      "fontSize": {
              "label-md": [
                      "14px",
                      {
                              "lineHeight": "1.2",
                              "letterSpacing": "0.02em",
                              "fontWeight": "500"
                      }
              ],
              "label-sm": [
                      "12px",
                      {
                              "lineHeight": "1.1",
                              "fontWeight": "600"
                      }
              ],
              "headline-lg": [
                      "24px",
                      {
                              "lineHeight": "1.3",
                              "fontWeight": "600"
                      }
              ],
              "headline-lg-mobile": [
                      "20px",
                      {
                              "lineHeight": "1.3",
                              "fontWeight": "600"
                      }
              ],
              "display-lg": [
                      "56px",
                      {
                              "lineHeight": "1.1",
                              "letterSpacing": "-0.03em",
                              "fontWeight": "800"
                      }
              ],
              "body-lg": [
                      "18px",
                      {
                              "lineHeight": "1.6",
                              "fontWeight": "400"
                      }
              ],
              "headline-xl": [
                      "32px",
                      {
                              "lineHeight": "1.2",
                              "letterSpacing": "-0.01em",
                              "fontWeight": "600"
                      }
              ],
              "body-md": [
                      "16px",
                      {
                              "lineHeight": "1.5",
                              "fontWeight": "400"
                      }
              ]
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
