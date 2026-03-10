import axios from 'axios';

const api = axios.create({
    baseURL:  'https://my-mental-health-api.duckdns.org/api'|| 'http://localhost:3000/api', ,
    withCredentials: true, // Include cookies in requests
});


export default api;