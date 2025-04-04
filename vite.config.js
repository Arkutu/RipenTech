import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Get home directory path
const homeDir = process.env.HOME || process.env.USERPROFILE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.join(homeDir, 'key.pem')),
      cert: fs.readFileSync(path.join(homeDir, 'cert.pem'))
    }
  }
})