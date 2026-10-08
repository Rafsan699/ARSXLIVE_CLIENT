import axios from 'axios';
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// paths include /api/cricket (LiveMatch & MatchHistoryView already use that)
const API = axios.create({ baseURL: BASE_URL });
export default API;
