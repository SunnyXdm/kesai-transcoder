import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv';
dotenv.config();


// https://vite.dev/config/
export default () => {
  process.env = { ...process.env, ...loadEnv('', process.cwd()) };

  return defineConfig({
    define: {
      global: 'globalThis',
      'process.env': process.env,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts: true
    }
  })
}