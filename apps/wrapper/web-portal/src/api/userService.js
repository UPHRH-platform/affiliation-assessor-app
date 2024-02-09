import axios from "axios";
import API_URL from "./apiUrl";
import { getCookie } from "../utils/common";

const BASE_URL =
  process.env.REACT_APP_WEB_PORTAL_USER_SERVICE_URL ||
  "https://auth.upsmfac.org/api/v1/";

const TOKEN_BASE_URL =
  process.env.REACT_APP_TOKEN_URL || "https://odk.upsmfac.org/auth/";

const keyCloakAxiosService = axios.create({
  baseURL: BASE_URL,
});

keyCloakAxiosService.interceptors.request.use(
  (request) => {
    console.log(request);
    // const user_data = getCookie('userData');
    request.headers["Accept"] = "*/*";
    request.headers["Content-Type"] = "application/json";
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

keyCloakAxiosService.interceptors.response.use(
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

const accessTokenAxiosService = axios.create({
  baseURL: TOKEN_BASE_URL,
});

accessTokenAxiosService.interceptors.request.use(
  (request) => {
    // const user_data = getCookie('userData');
    request.headers["Accept"] = "*/*";
    request.headers["Content-Type"] = "application/x-www-form-urlencoded";
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

accessTokenAxiosService.interceptors.response.use(
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

const generateOtp = (postData) => {
  return axios.post(`${BASE_URL}${API_URL.LOGIN.GENERATE_OTP}`, postData, {
    headers: {
      "Content-Type": "application/json",
      // "Authorization": getCookie("access_token")
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });
};

//Deactivate user keycloak
export const deActivateUserKeycloak = async (postData) => {
  
  return axios.post(`${BASE_URL}${API_URL.USER.DEACTIVATE}`, postData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });
};

//Activate user keycloak
export const activateUserKeycloak = async (postData) => {

    return axios.post(`${BASE_URL}${API_URL.USER.ACTIVATE}`, postData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.REACT_APP_AUTH_TOKEN,
      },
    });

};

const signup = (userDetails) => {
  return axios.post(`${BASE_URL}${API_URL.SIGNUP.CREATE_USER}`, userDetails, {
    headers: {
      "Content-Type": "application/json",
      // "Authorization": getCookie("access_token")
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });
};

const login = (userDetails) => {
  return keyCloakAxiosService.post(API_URL.LOGIN.USERLOGIN, userDetails, {
    headers: {
      "Content-Type": "application/json",
      // "Authorization": getCookie("access_token")
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });
 /*  return {
    accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6eE80ak9FNWNjQjhGeXhuZnlIaGZNY1NYNDd0UXRCSWl4ellIbnBWdzlRIn0.eyJleHAiOjE3MDc0MDc0NjAsImlhdCI6MTcwNzMyMTA2MCwianRpIjoiYjc5ZjFiYjktYjU4MC00MWEzLWE2MjktNDdhNWM5ZmE5NzBlIiwiaXNzIjoiaHR0cHM6Ly9yZWdpc3RyYXRpb24udXBocmguaW4vYXV0aC9yZWFsbXMvc3VuYmlyZC1yYyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJlYTkyMTFjNS1kNzY5LTQ1NmItODZhMS04MGNiZTkzNWUxMjEiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJyZWdpc3RyeS1mcm9udGVuZCIsInNlc3Npb25fc3RhdGUiOiIzN2RjNmIxZi1mNGFiLTQxMGQtOWNhOS0zNWU2OTlmODA2MzIiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLW5kZWFyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoic2hpc2hpciBzdXBlciBhZG1pbiIsInByZWZlcnJlZF91c2VybmFtZSI6InNoaXNoaXIuc3VtYW4rc3VwZXJhZG1pbkB0YXJlbnRvLmNvbSIsImdpdmVuX25hbWUiOiJzaGlzaGlyIiwiZmFtaWx5X25hbWUiOiJzdXBlciBhZG1pbiIsImVtYWlsIjoic2hpc2hpci5zdW1hbitzdXBlcmFkbWluQHRhcmVudG8uY29tIn0.Q3c_tWTxYwmSLdGeY8pDF6TUlJdsl_miaaY8rquvbuAxW1iu0-n859b5JSYpfrkAYBqbpTrW5s9H0B1CAFhZG6u50zCopz3cCgEFt3jObFhxqBuk-DPzrGUTHUOpRUm-S8KS0dYtd_e_U83oq7LOVOxRPHmQ2qqGkEsMtI-7HSZHbLxGkYFBz7Do6SsG2_A9cFjYMOPJ7Zi8iKqPUUiFnrjKNH5dAVJz23OwL4RLrzJNQ6HwC83_k3VXXWb5-VMatk_BFNtTmQErduOmY8QGhVk65pi75KYWUmweyZ8fP2b8ojbAjM8J0fjkoVfmrn4t5zgZb2pxpcfRbF9IgLdspw",
    expiresIn: 86400,
    refreshToken: null,
    refreshExpiresIn: 0,
    tokenType: "Bearer",
    scope: "profile email",
    userRepresentation: {
      self: null,
      id: "ea9211c5-d769-456b-86a1-80cbe935e121",
      origin: null,
      createdTimestamp: 1699507701802,
      username: "shishir.suman+superadmin@tarento.com",
      enabled: true,
      totp: false,
      emailVerified: false,
      firstName: "shishir",
      lastName: "super admin",
      email: "shishir.suman+superadmin@tarento.com",
      federationLink: null,
      serviceAccountClientId: null,
      attributes: {
        Role: [
          "Super-Admin"
        ]
      },
      credentials: null,
      disableableCredentialTypes: [],
      requiredActions: [],
      federatedIdentities: null,
      realmRoles: null,
      clientRoles: null,
      clientConsents: null,
      notBefore: 0,
      applicationRoles: null,
      socialLinks: null,
      groups: null,
      access: {
        manageGroupMembership: true,
        view: true,
        mapRoles: true,
        impersonate: false,
        manage: true
      }
    },
    roleRepresentationList: [
      {
        id: "a4b21820-1b52-4b6a-851e-0a9955ead1f0",
        name: "default-roles-ndear",
        description: "${role_default-roles-ndear}",
        scopeParamRequired: null,
        composite: true,
        composites: null,
        clientRole: false,
        containerId: "sunbird-rc",
        attributes: null
      },
      {
        id: "a5777369-2e60-45ee-bfcd-0cc84a46470d",
        name: "uma_authorization",
        description: "${role_uma_authorization}",
        scopeParamRequired: null,
        composite: false,
        composites: null,
        clientRole: false,
        containerId: "sunbird-rc",
        attributes: null
      },
      {
        id: "30d1a784-d1af-43c0-9c86-8a3679503dee",
        name: "offline_access",
        description: "${role_offline-access}",
        scopeParamRequired: null,
        composite: false,
        composites: null,
        clientRole: false,
        containerId: "sunbird-rc",
        attributes: null
      }
    ]
  } */
};

const getAccessToken = (postData) => {
  return accessTokenAxiosService.post(
    API_URL.ACCESS_TOKEN.TOKEN_URL,
    postData,
    {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": getCookie("access_token")
        Authorization: process.env.REACT_APP_AUTH_TOKEN,
      },
    }
  );
};

const deleteUsers = (postData) => {
  return axios.post(`${BASE_URL}${API_URL.DELETE.DELETE_USER}`, postData, {
    headers: {
      "Content-Type": "application/json",
      // "Authorization": getCookie("access_token")
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });
};

const isUserActive = (postData) => {
  return keyCloakAxiosService.post(API_URL.USER.CHECKVALID,
     {
      request:{
        fieldName: "email",
        fieldValue: postData.email
      }
  },
     {
    headers: {
      "Content-Type": "application/json",
      // "Authorization": getCookie("access_token")
      Authorization: process.env.REACT_APP_AUTH_TOKEN,
    },
  });

};
export const userService = {
  generateOtp,
  login,
  deleteUsers,
  signup,
  getAccessToken,
  deActivateUserKeycloak,
  activateUserKeycloak,
  isUserActive
};
