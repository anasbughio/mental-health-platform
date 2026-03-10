import axios from 'axios';

const api = axios.create({
    baseURL:   'http://localhost:3000/api' || 'https://my-mental-health-api.duckdns.org/api',
    withCredentials: true, // Include cookies in requests
});


export default api;