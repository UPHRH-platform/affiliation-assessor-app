let ADMIN_ROUTE_MAP = {};
export const DA_ROUTE_MAP = {};
let MANAGE_USERS = "manage-users";
let CERTIFICATE_MANAGEMENT = "certificate-management"
let GROUND_INSPECTION = "ground-inspection";
let MANAGE_FORMS = "manage-forms";
let DESKTOP_ANALYSIS = "desktop-analysis";
let SCHEDULE_MANAGEMENT = "schedule-management";
let NOTIFICATIONS = "notifications"
let DASHBOARD = "dashboard"
const ROLE_MANAGEMENT = "role-management";

ADMIN_ROUTE_MAP.auth = "/auth";
ADMIN_ROUTE_MAP.loginModule = {
  login: `${ADMIN_ROUTE_MAP.auth}/login`,
  loginOtp: `${ADMIN_ROUTE_MAP.auth}/loginOtp`,
  register: `${ADMIN_ROUTE_MAP.auth}/register`,
  registerOtp: `${ADMIN_ROUTE_MAP.auth}/registerOtp`,
};

ADMIN_ROUTE_MAP.adminModule = {
  manageUsers: {
    home: `/${MANAGE_USERS}`,
    list: `/${MANAGE_USERS}/list`,
    createUser: `/${MANAGE_USERS}/create-update-user`,
  },
  manageForms: {
    home: `/${MANAGE_FORMS}`,
    overview: `/${MANAGE_FORMS}/overview`,
    createForm: `/${MANAGE_FORMS}/create-form`,
    upload: `/${MANAGE_FORMS}/upload`,
    viewForm: `/${MANAGE_FORMS}/view`,
  },
  desktopAnalysis: {
    home: `/${DESKTOP_ANALYSIS}`,
    list: `/${DESKTOP_ANALYSIS}/list`,
    viewForm: `/${DESKTOP_ANALYSIS}/view`,
  },
  onGroundInspection: {
    home: `/${GROUND_INSPECTION}`,
    list: `/${GROUND_INSPECTION}/list`,
    viewForm: `/${GROUND_INSPECTION}/view`,
    nocIssued: `/${GROUND_INSPECTION}/noc-issued`,
  },
  certificateManagement: {
    home: `/${CERTIFICATE_MANAGEMENT}`,
    list: `/${CERTIFICATE_MANAGEMENT}/list`,
  },
  scheduleManagement: {
    home: `/${SCHEDULE_MANAGEMENT}`,
    list: `/${SCHEDULE_MANAGEMENT}/list`,
    uploadForm: `/${SCHEDULE_MANAGEMENT}/upload-form`,

  },
  notifications: {
    home: `/${NOTIFICATIONS}`,
  },
  dashboard: {
    home: `/${DASHBOARD}`,
  },
  roleManagement: {
    home: `/${ROLE_MANAGEMENT}`,
    list: `/${ROLE_MANAGEMENT}/list`,
    updateRole: `/${ROLE_MANAGEMENT}/create-update-role`,
  }
  
};

export default ADMIN_ROUTE_MAP;
