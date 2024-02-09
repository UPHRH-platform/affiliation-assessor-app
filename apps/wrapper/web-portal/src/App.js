import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ADMIN_ROUTE_MAP from "./routes/adminRouteMap";
import "./App.css";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import fireBaseApp, {
  onMessageListener,
  getPermissionForToken,
} from "./config/firebase";

// import { messaging } from "firebase/compat/messaging";

// login pages...
import Authenticate from "./login/Authenticate";
import AdminLogin from "./login/AdminLogin";
import EnterOtp from "./login/EnterOtp";
import AdminSingUp from "./login/AdminSignUp";
import LoginEnterOtp from "./login/LoginEnterOtp";

// Dashboard pages...
import DashboardLandingPage from "./pages/dashboard/DashboardLandingPage";
import GroundInspectionAnalysis from "./pages/ground-analysis/GroundInspectionAnalysis";
import GroundInspectionListForms from "./pages/ground-analysis/GroundInspectionListForms";
import GroundInspectionViewForm from "./pages/ground-analysis/GroundInspectionViewForm";
import ManageUsersList from "./pages/manage-users/ManageUsersList";
import AdminCreateUser from "./pages/manage-users/AdminCreateUser";
// import ManageFormsList from "./pages/manage-forms/ManageFormsList";

import ManageForms from "./pages/manage-forms/ManageForms";
import FormsOverview from "./pages/manage-forms/FormsOverview";
import CreateForm from "./pages/manage-forms/CreateForm";
import UploadForm from "./pages/manage-forms/UploadForm";

import ManageRolesList from "./pages/role-management/ManageRolesList";
import ManageRole from "./pages/role-management/ManageRole";
import CreateUpdateRole from "./pages/role-management/CreateUpdateRole";

import DesktopAnalysisList from "./pages/desktop-analysis/DesktopAnalysisList";
import DesktopAnalysisView from "./pages/desktop-analysis/DesktopAnalysisView";
import CertificateManagement from "./pages/certificate-management/CertificateManagement";
import CertificateManagementList from "./pages/certificate-management/CertificateManagementList";
import ScheduleManagementList from "./pages/schedule-management/ScheduleManagementList";
import ManageUser from "./pages/manage-users/ManageUser";
import DesktopAnalysis from "./pages/desktop-analysis/DesktopAnalysis";
import PrivateRoute from "./routes/PrivateRoute";
import ScheduleManagement from "./pages/schedule-management/ScheduleManagement";
import Notification from "./pages/notifications/Notification";
import NotificationsDetailedView from "./pages/notifications/NotificationsDetailedView";
import NocIssued from "./pages/ground-analysis/NocIssuedConfirmation";
import Spinner from "./components/spinner";
import { ContextAPI } from "./utils/ContextAPI";
import { getCookie, getLocalTimeInISOFormat } from "./utils";
import Toast from "./components/Toast";


function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const loggedInUser = getCookie("regulator")?.[0];
 
  const [spinner, setSpinner] = useState(false);
  const [toast, setToast] = useState({
    toastOpen: false,
    toastMsg: "",
    toastType: "",
  });

  const messaging = getMessaging(fireBaseApp);
  const onMessageListener = (async () => {
    const messagingResolve = await messaging;
    if (messagingResolve) {
      onMessage(messagingResolve, (payload) => {
        console.log(payload);
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: payload.data.title,
          toastType: "success",
        }));
      });
    }
  })();

  useEffect(() => {
    getPermissionForToken();

setInterval(() => {
 // console.log("checking conn",navigator.onLine)
  if(!navigator.onLine){
    setToast((prevState) => ({
      ...prevState,
      toastOpen: true,
      toastMsg: "You seem to be offline. Please check your internet connection.",
      toastType: "error",
    }));
  }
}, 5000);

  }, []);

  useEffect(() => {
    if (toast?.toastOpen) {
      setTimeout(() => {
        setToast({
          toastOpen: false,
          toastMsg: "",
          toastType: "",
        });
      }, 3000);

    }
  }, [toast]);

  return (
    <div className="App">
      <ContextAPI.Provider value={{ setSpinner, setToast, toast }}>
        {spinner && <Spinner />}
        {toast.toastOpen && (
          <Toast toastMsg={toast.toastMsg} toastType={toast.toastType} />
        )}
        <BrowserRouter>
          <Routes>
            {/* Default landing page */}
            {<Route path="/" element={<Navigate to="/auth/login" />} />}

            {/* Register and Login Routes */}
            <Route path={ADMIN_ROUTE_MAP.auth} element={<Authenticate />}>
              <Route
                path={ADMIN_ROUTE_MAP.loginModule.login}
                element={<AdminLogin />}
              ></Route>
              <Route
                path={ADMIN_ROUTE_MAP.loginModule.loginOtp}
                element={<LoginEnterOtp />}
              ></Route>
              {/* <Route
                path={ADMIN_ROUTE_MAP.loginModule.register}
                element={<AdminSingUp />}
              ></Route> */}
            </Route>

            {loggedInUser?.role === "Desktop-Assessor" &&
                (
                  <Route
                    path={ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}
                    element={<DesktopAnalysis />}
                  >
                    <Route index element={<DesktopAnalysisList />}></Route>
                    <Route
                      path={`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.viewForm}/:formName/:formId`}
                      element={<DesktopAnalysisView />}
                    ></Route>
                  </Route>

                )}
               
            <Route
            >
             
              <Route
                path="*"
                element={
                  <Navigate
                    to={`${loggedInUser?.role === "Super-Admin"
                      ? ADMIN_ROUTE_MAP.adminModule.manageUsers.home
                      : ADMIN_ROUTE_MAP.adminModule.manageForms.home
                      }`}
                  />
                }
              />
            </Route>
            {(() => {
        switch (loggedInUser?.role) {
          case 'Super-Admin':
            return <Route>          
                  <Route
                  path={ADMIN_ROUTE_MAP.adminModule.manageUsers.home}
                  element={<ManageUser />}
                >
                  <Route index element={<ManageUsersList />}></Route>
                  <Route
                    path={`${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/:userId?`}
                    element={<AdminCreateUser />}
                  ></Route>
                </Route>

            {/* Notifications routing starts here */}
            <Route
              path={`${ADMIN_ROUTE_MAP.adminModule.notifications.home}/:notificationId?`}
              element={<Notification />}
            >
              <Route index element={<NotificationsDetailedView />}></Route>
            </Route>
            {/*Manage forms routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.manageForms.home}
              element={<ManageForms />}
            >
              <Route index element={<FormsOverview />}></Route>
              <Route
                path={ADMIN_ROUTE_MAP.adminModule.manageForms.createForm}
                element={<CreateForm />}
              ></Route>
              <Route
                path={ADMIN_ROUTE_MAP.adminModule.manageForms.upload}
                element={<UploadForm />}
              ></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.manageForms.viewForm}/:formName/:formId`}
                element={<CreateForm />}
              ></Route>
            </Route>
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}
              element={<DesktopAnalysis />}
            >
              <Route index element={<DesktopAnalysisList />}></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.viewForm}/:formName/:formId`}
                element={<DesktopAnalysisView />}
              ></Route>
            </Route>
            {/*Ground Inspection routing starts here  */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}
              element={<GroundInspectionAnalysis />}
            >
              <Route index element={<GroundInspectionListForms />}></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.viewForm}/:formName/:formId/:instituteName/:round/:date`}
                element={<GroundInspectionViewForm />}
              ></Route>

              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.nocIssued}/:round`}
                element={<NocIssued />}
              ></Route>
            </Route>
            {/* Certificate management routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.certificateManagement.home}
              element={<CertificateManagement />}
            >
              <Route index element={<CertificateManagementList />}></Route>
            </Route>
            {/* Schedule management routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.scheduleManagement.home}
              element={<ScheduleManagement />}
            >
              <Route index element={<ScheduleManagementList />}></Route>
            </Route>
            <Route path={ADMIN_ROUTE_MAP.adminModule.dashboard.home}
              element={
                <PrivateRoute>
                  <DashboardLandingPage />
                </PrivateRoute>
              }
              ></Route>

              <Route
                path={ADMIN_ROUTE_MAP.adminModule.roleManagement.home}
                element={<ManageRole />}
              >
                <Route index element={<ManageRolesList />}></Route>
                <Route
                  path={`${ADMIN_ROUTE_MAP.adminModule.roleManagement.updateRole}/:roleId?/:roleName?`}
                  element={<CreateUpdateRole />}
                ></Route>
              </Route>


             <Route path={ADMIN_ROUTE_MAP.adminModule.roleManagement.home}
              element={
                <PrivateRoute>
                  <ManageRolesList />
                </PrivateRoute>
              }
            ></Route>
            </Route>  
           case 'Desktop-Admin':
             return <Route>          
            {/* Notifications routing starts here */}
            <Route
              path={`${ADMIN_ROUTE_MAP.adminModule.notifications.home}/:notificationId?`}
              element={<Notification />}
            >
              <Route index element={<NotificationsDetailedView />}></Route>
            </Route>
            {/*Manage forms routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.manageForms.home}
              element={<ManageForms />}
            >
              <Route index element={<FormsOverview />}></Route>
              <Route
                path={ADMIN_ROUTE_MAP.adminModule.manageForms.createForm}
                element={<CreateForm />}
              ></Route>
              <Route
                path={ADMIN_ROUTE_MAP.adminModule.manageForms.upload}
                element={<UploadForm />}
              ></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.manageForms.viewForm}/:formName/:formId`}
                element={<CreateForm />}
              ></Route>
            </Route>
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}
              element={<DesktopAnalysis />}
            >
              <Route index element={<DesktopAnalysisList />}></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.viewForm}/:formName/:formId`}
                element={<DesktopAnalysisView />}
              ></Route>
            </Route>
            {/*Ground Inspection routing starts here  */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}
              element={<GroundInspectionAnalysis />}
            >
              <Route index element={<GroundInspectionListForms />}></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.viewForm}/:formName/:formId/:instituteName/:round/:date`}
                element={<GroundInspectionViewForm />}
              ></Route>

              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.nocIssued}/:round`}
                element={<NocIssued />}
              ></Route>
            </Route>
            {/* Certificate management routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.certificateManagement.home}
              element={<CertificateManagement />}
            >
              <Route index element={<CertificateManagementList />}></Route>
            </Route>
            {/* Schedule management routing starts here */}
            <Route
              path={ADMIN_ROUTE_MAP.adminModule.scheduleManagement.home}
              element={<ScheduleManagement />}
            >
              <Route index element={<ScheduleManagementList />}></Route>
            </Route>
            <Route path={ADMIN_ROUTE_MAP.adminModule.dashboard.home}
              element={
                <PrivateRoute>
                  <DashboardLandingPage />
                </PrivateRoute>
              }
            ></Route>
            </Route> 
          case 'Desktop-Assessor':
            return <Route>
                <Route
              path={ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}
              element={<DesktopAnalysis />}
            >
              <Route index element={<DesktopAnalysisList />}></Route>
              <Route
                path={`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.viewForm}/:formName/:formId`}
                element={<DesktopAnalysisView />}
              ></Route>
            </Route>
            </Route>
          default:
            return null
        }
      })()}
          </Routes>
        </BrowserRouter>
      </ContextAPI.Provider>
    </div>
  );
}

export default App;
