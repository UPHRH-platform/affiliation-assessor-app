export const APIS = {
  APPLICATIONS: {
    STATUS_LIST: "/rest/getApplicationStatus",
  },
  COMMON: {
    REGISTER_EVENT: `/rest/addEvents`,
    UPDATE_APPLICANT_DEVICE_ID: `/rest/updateApplicantDeviceId`
  },
  FORMS: {
    LIST: "/rest/getAllCourses",
    VIEW_FORM: `/rest/getFormData`,
  },
  SIGNUP: {
    CREATE_USER: "create",
  },
  EDITUSERS:{
    EDIT_USER: "update",
  },

  LOGIN: {
    GENERATE_OTP: "keycloak/otp",
    USERLOGIN: "keycloak/login",
  },
  APPLICANT: {
    ADD_INSTITUTE: "rest/addInstitute",
    ADD_INSTITUTE_POC: "rest/addInstitutePoc",
    GET_APPLICANT_DETAILS: "rest/getApplicant",
    ADD_TRANSACTION: `rest/addTransaction`,
    UPDATE_PARENT_CODE: `rest/updateParentCode`

  },
  PROFILE: {
    VIEW_PROFILE : "rest/getInstitute",
    EDIT_PROFILE : "rest/editInstitute"
  },
  ACCESS_TOKEN: {
    TOKEN_URL: "realms/sunbird-rc/protocol/openid-connect/token"
  },
  FORM: {
    UPDATE_FORM: "/rest/updateFormSubmission",
    UPDATE_CHILD_CODE: "/rest/updateChildCode"
  },
  SEARCH:{
    SEARCH_FORM: "/rest/searchCourses"
  },
  notifications:{
    //new APIs
    sendPushNotification: `notification/send`,
    getAllRegulatorDeviceId: `rest/getAllRegulatorDeviceId`,
    getAllNotifications: `notification/all`,
    emailNotify: `email/notify`,
    readNotification: `notification/update`,
  },
  PAYMENT:{
    GENERATE_LINK: `payment/generatelink`,
    UPDATE_PAYMENT_STATUS: `rest/updatePaymentStatus`
  }
};
