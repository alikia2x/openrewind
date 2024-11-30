import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { join } from 'path';

// https://vite.dev/config/
export default defineConfig({
  root: join(__dirname, 'src/renderer'),
  build: {
    outDir: join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  plugins: [react(),tsconfigPaths()],
})
