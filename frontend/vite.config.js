import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: Ensure base path works for Vercel
  base: './',  // Use relative paths for assets
});
