const axios = require('axios');

const api = axios.create({
  baseURL: 'https://hospital-information-assistant-k69p.onrender.com/api/v1',
});

console.log(api.getUri({ url: '/auth/register' }));
