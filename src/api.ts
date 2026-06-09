import axios from 'axios';

// 开发环境用 Vite 代理，生产环境用实际后端地址
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 180000, // 3 分钟超时（LLM 调用可能比较慢）
});

export default api;
