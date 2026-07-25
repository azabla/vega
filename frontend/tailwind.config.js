/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enables dark mode using a class on the html element
    theme: {
      extend: {
        colors: {
          // "Premium" monochromatic palette
          brand: {
            light: '#fdfdfd',
            dark: '#0a0a0a',
            accent: '#3b82f6', // Subtle blue for links/actions
          },
          surface: {
            50: '#f8fafc',
            100: '#f1f5f9',
            800: '#1e293b',
            900: '#0f172a',
          }
        },
        fontFamily: {
          // Modern, clean sans-serif stack
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['Calans', 'Inter', 'system-ui'], // For headings
        },
        letterSpacing: {
          tightest: '-.075em',
          widest: '.25em',
        },
        backgroundImage: {
          // For that modern 'glass' and mesh gradient look
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        },
      },
    },
    plugins: [
      // Standard plugins for professional web dev
      require('@tailwindcss/typography'), // Better styling for blog Markdown content
      require('@tailwindcss/forms'),      // Resets for contact forms
    ],
  }