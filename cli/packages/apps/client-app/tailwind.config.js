/** @type {import('tailwindcss').Config} */
import sharedConfig from "../../libs/components/tailwind.config.js"

export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../libs/components/src/**/*.{js,ts,jsx,tsx}",
  ],
}
