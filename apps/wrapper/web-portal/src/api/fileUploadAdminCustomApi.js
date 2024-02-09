import axios from "axios";

const BASE_URL = process.env.REACT_APP_NODE_URL;
const fileUploadAdminCustomApi = axios.create({
  baseURL: BASE_URL,
});

fileUploadAdminCustomApi.interceptors.request.use(
  (request) => {
    request.headers["Content-Type"] = "multipart/form-data";
    request.headers["Authorization"] = process.env.REACT_APP_AUTH_TOKEN;
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default fileUploadAdminCustomApi;
