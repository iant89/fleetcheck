import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // GitHub Pages publishes this project beneath /fleetcheck/; Vite dev stays at /.
  base: mode === 'production' ? '/fleetcheck/' : '/',
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true },
}));