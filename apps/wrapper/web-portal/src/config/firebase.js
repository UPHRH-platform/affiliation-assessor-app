import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getCookie, setCookie } from "../utils";
import { updateRegulatorDeviceId } from "../api";

const VAPID_KEY =
  "BHQYJFpVAvAyVm0Gnk2yDT8snQ98N6eVx5VlRAcrFgGbWWK5GBy55AJYupwCkP19OzxsdG1OFHBlPwIvqhazWV8";
const firebaseConfig = {
  apiKey: "AIzaSyDOS8cUwjl-30_cYZvYcnmbtQoCxslQ2qE",
  authDomain: "test-upsmf.firebaseapp.com",
  projectId: "test-upsmf",
  storageBucket: "test-upsmf.appspot.com",
  messagingSenderId: "641236652787",
  appId: "1:641236652787:web:e428a35978b9d46c841d86",
};

const fireBaseApp = initializeApp(firebaseConfig);
export default fireBaseApp;

const messaging = getMessaging(fireBaseApp);
export const onMessageListener = () => {
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export const getPermissionForToken = () => {
  window.Notification.requestPermission();
  const permission = window.Notification.permission;
  if (permission === "granted") {
    console.log(" User Permission Granted for Notifications.");
    return getToken(messaging, { vapidKey: `${VAPID_KEY}` })
      .then((currentToken) => {
        if (currentToken) {
          console.log("Client Token: ", currentToken);
          setCookie("firebase_client_token", currentToken);
          if (getCookie("userData") !== undefined) {
            updateRegulatorDeviceId({
              user_id: getCookie("userData")?.id,
              device_id: JSON.stringify([getCookie("firebase_client_token")]),
            });
          }
        } else {
          console.log("Failed to generate the app registration token.");
        }
      })
      .catch((err) => {
        console.log(
          "An error occurred when requesting to receive the token.",
          err
        );
      });
  } else if (permission === "default") {
    window.Notification.requestPermission();
  } else {
    console.log("User Permission Denied for notifications.");
  }
};
