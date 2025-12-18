/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'canvas': '#1a1a1a',
                'panel': '#252525',
                'panel-light': '#2f2f2f',
                'border': '#3a3a3a',
                'accent': '#e31937',  // Tesla Red
                'accent-hover': '#ff2d4d',
            },
            fontFamily: {
                'display': ['Orbitron', 'monospace'],
                'body': ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}