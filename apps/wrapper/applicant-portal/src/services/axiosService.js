import axios from "axios";
// import { getCookie } from '../utils';

const BASE_URL = process.env.REACT_APP_HASURA_SERVICE_URL;
const HASURA_CLIENT_NAME =
  process.env.REACT_APP_HASURA_CLIENT_NAME || "hasura-console";
const X_HASURA_ADMIN_SECRET_KEY =
  process.env.REACT_APP_X_HASURA_ADMIN_SECRET_KEY || "myadminsecretkey";

const axiosService = axios.create({
  baseURL: BASE_URL,
});

axiosService.interceptors.request.use(
  (request) => {
    // const user_data = getCookie('userData');
    request.headers["Accept"] = "application/json";
    request.headers["Content-Type"] = "application/json";
    request.headers["Hasura-Client-Name"] = HASURA_CLIENT_NAME;
    request.headers["x-hasura-admin-secret"] = X_HASURA_ADMIN_SECRET_KEY;
    // request.headers['Authorization'] = `Bearer ${user_data.token}`;
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosService.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    let res = error.response;
    if (res.status === 401) {
      console.error("Unauthorized  user. Status Code: " + res.status);
      // window.location.href = “https://example.com/login”;
    }
    console.error("Looks like there was a problem. Status Code: " + res.status);
    return Promise.reject(res?.data?.error);
  }
);

export default axiosService;