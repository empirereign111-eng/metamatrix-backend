import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // ✅ এই লাইনটি যোগ করা হয়েছে (Electron-এর জন্য বাধ্যতামূলক)
  plugins: [react()],
})