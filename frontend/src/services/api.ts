import axios from 'axios';

/*
 VITE_API_URL=http://localhost:8080/api/v1/ npm run dev
 VITE_API_URL=http://localhost:8080/api/v1/ npm run dev -- --port 5173
*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@Intellisys:user');
      localStorage.removeItem('@Intellisys:colaborador');
      window.location.href = '/plantao/';
    }
    return Promise.reject(error);
  }
);

export default api;
