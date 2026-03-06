/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#1e3a8a', // Dark institutional blue
                    light: '#3b82f6', // Light blue for accents
                }
            }
        },
    },
    plugins: [],
}
