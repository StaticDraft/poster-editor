import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true, // 开启 host:true 允许通过网络 IP 访问，专门解决 ERR_CONNECTION_REFUSED
    proxy: {
      // 这里的代理前缀 /api 和目标地址可以随时根据你的真实后端服务替换
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
