import XMLParser from "react-xml-parser";
import localforage from "localforage";
import Cookies from "js-cookie";
import * as serviceWorkerRegistration from "../serviceWorkerRegistration";
import axios from "axios";

import {
  getMedicalAssessments,
  getPrefillXML,
  getSubmissionXML,
  registerEvent,
} from "../api";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
const GCP_URL = process.env.REACT_APP_GCP_AFFILIATION_LINK;
const OPEN_ROSA_SERVER_URL = process.env.REACT_APP_OPEN_ROSA_SERVER_URL;

export const makeHasuraCalls = async (query) => {
  const userData = getCookie("userData");
  return fetch(process.env.REACT_APP_HASURA_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Hasura-Client-Name": process.env.REACT_APP_HASURA_CLIENT_NAME,
      "x-hasura-admin-secret": process.env.REACT_APP_HASURA_ADMIN_SECRET_KEY,
    },
    body: JSON.stringify(query),
  })
    .then(async (response) => await validateResponse(response))
    .catch((error) => {
      return error;
    });
};

const validateResponse = async (response) => {
  const apiRes = await response.json();

  const jsonResponse = {
    ...apiRes,
    responseStatus: false,
  };
  return jsonResponse;
};

export const makeDataForPrefill = (prev, xmlDoc, key, finalObj, formName) => {
  if (Array.isArray(xmlDoc) && xmlDoc.length == 0 && prev.value) {
    finalObj[key] = prev.value;
  } else {
    for (const el in xmlDoc) {
      makeDataForPrefill(
        xmlDoc[el],
        xmlDoc[el].children,
        key + "_*_" + xmlDoc[el].name,
        finalObj,
        formName
      );
    }
  }
};

export const updateFormData = async (startingForm, formData, fileURLs) => {
  try {
    let data = await getFromLocalForage(
      `${startingForm}_${new Date().toISOString().split("T")[0]}`
    );
    const GCP_form_url = `${GCP_URL}${startingForm}.xml`;
    let prefilledForm = await getSubmissionXML(
      GCP_form_url,
      formData,
      fileURLs
    );
    return prefilledForm;
  } catch (err) {}
};

export const setCookie = (cname, cvalue) => {
  try {
    Cookies.set(cname, JSON.stringify(cvalue));
  } catch (error) {
    return false;
  }
};

export const getCookie = (cname) => {
  try {
    let cookie = Cookies.get(cname);
    if (cookie) return JSON.parse(cookie);
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
  localforage.clear();
  window.location = "/web/login";
  removeCookie("userData");
  serviceWorkerRegistration.unregister();
  let db;
      const DBOpenRequest = window.indexedDB.open("enketo", 3);
      DBOpenRequest.onsuccess = (event) => {
        db = DBOpenRequest.result;
      
        // Clear all the data from the object store
        clearData(db);
};
}

const clearData = (db) => {
  // open a read/write db transaction, ready for clearing the data
  const transaction = db?.transaction(["records"], "readwrite");
  const enketodata = db?.transaction(["data"], "readwrite");

  // report on the success of the transaction completing, when everything is done
  // create an object store on the transaction
  const objectStore = transaction.objectStore("records");
  const objectStore2 = enketodata.objectStore("data");

  // Make a request to clear all the data out of the object store
  const objectStoreRequest = objectStore.clear();
  const objectStoreRequest2 = objectStore2.clear();

  objectStoreRequest.onsuccess = (event) => {
    // report the success of our request
    console.log("cleared entry - store (records)");
  };
  objectStoreRequest2.onsuccess = (event) => {
    // report the success of our request
    console.log("cleared entry - store 2 (data)");
  };
}

export const removeCookie = (cname) => {
  try {
    Cookies.remove(cname);
    return true;
  } catch (error) {
    return false;
  }
};

export const isImage = (key, filename) => {
  if (
    filename.includes(".png") ||
    filename.includes(".tif") ||
    filename.includes(".tiff") ||
    filename.includes(".jpg") ||
    filename.includes(".jpeg") ||
    filename.includes(".bmp") ||
    filename.includes(".gif") ||
    filename.includes(".eps")
  )
    return true;
  if (key.includes("img") || key.includes("image")) return true;
  return false;
};

export const getFromLocalForage = async (key) => {
  const user = getCookie("userData");
  try {
    console.log(`key - ${user?.userRepresentation?.id}_${key}`);
    return await localforage.getItem(`${user?.userRepresentation?.id}_${key}`);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getAllKeysFromForage = async () => {
  let keys = [];
  await localforage.keys().then((keysOfArray) => {
    keys = keysOfArray;
  });
  return keys;
};

export const setToLocalForage = async (key, value) => {
  const storedData = await getSpecificDataFromForage(key);
  if (storedData) {
    const newData = { ...storedData, ...value };
    await localforage.setItem(key, newData);
  } else {
    await localforage.setItem(key, value);
  }
};

export const getSpecificDataFromForage = async (key) => {
  return await localforage.getItem(key);
};

export const removeItemFromLocalForage = (key) => {
  localforage.removeItem(key);
};

export const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
  const user = getCookie("userData");
  if (
    ((ENKETO_URL === `${e?.origin}/enketo`) || (ENKETO_URL === `${e?.origin}/enketo/`)) &&
    // e.origin === ENKETO_URL &&
    typeof e?.data === "string" &&
    JSON.parse(e?.data)?.state !== "ON_FORM_SUCCESS_COMPLETED"
  ) {
    var formData = new XMLParser().parseFromString(JSON.parse(e?.data)?.formData);
    if (formData) {
      let images = JSON.parse(e?.data)?.fileURLs;
      let prevData = await getFromLocalForage(
        `${startingForm}_${new Date().toISOString().split("T")[0]}`
      );
      await setToLocalForage(
        `${user?.userRepresentation?.id}_${startingForm}_${
          new Date().toISOString().split("T")[0]
        }`,
        {
          formData: JSON.parse(e?.data)?.formData,
          imageUrls: { ...prevData?.imageUrls, ...images },
        }
      );
    }
  }
  afterFormSubmit(e);
};

export const getFormData = async ({
  loading,
  scheduleId,
  formSpec,
  startingForm,
  formId,
  setData,
  setEncodedFormSpec,
  setEncodedFormURI,
  isPreview,
}) => {
  const GCP_form_url = `${process.env.REACT_APP_GCP_AFFILIATION_LINK}${startingForm}.xml`;
  const res = await getMedicalAssessments(formSpec.date);
  let formData, prefillXMLArgs;
  if (res?.data?.assessment_schedule?.[0]) {
    loading.current = true;
    let assessment = res?.data?.assessment_schedule?.[0];
    scheduleId.current = assessment.id;
    setData({
      schedule_id: assessment.id,
      id: assessment.institute.id,
      district: assessment.institute.district,
      instituteName: assessment.institute.name,
      specialization:
        assessment.institute?.institute_specializations?.[0]?.specializations,
      courses: assessment.institute?.institute_types?.[0]?.types,
      type: assessment.institute.sector,
      latitude: assessment.institute.latitude,
      longitude: assessment.institute.longitude,
    });

    if (formSpec.date) {
      formData = await getSpecificDataFromForage("selected_assessment_form");
      prefillXMLArgs = [
        `${GCP_form_url}`,
        "",
        formData.form_data,
        formData.imageUrls,
      ];
    } else {
      formData = await getFromLocalForage(
        `${startingForm}_${new Date().toISOString().split("T")[0]}`
      );
      if (formData) {
        setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
        prefillXMLArgs = [
          `${GCP_form_url}`,
          formSpec.forms[formId].onSuccess,
          formData.formData,
          formData.imageUrls,
        ];
      } else {
        prefillXMLArgs = [`${GCP_form_url}`, formSpec.forms[formId].onSuccess];
      }
    }

    let prefilledForm = await getPrefillXML(...prefillXMLArgs);
    setEncodedFormURI(prefilledForm);

    // formData = await getFromLocalForage(`${startingForm}_${new Date().toISOString().split("T")[0]}`);
    // if (formData) {
    //   setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
    //   prefillXMLArgs = [
    //     `${GCP_form_url}`,
    //     formSpec.forms[formId].onSuccess,
    //     formData.formData,
    //     formData.imageUrls,
    //   ];
    // } else {
    //   prefillXMLArgs = [`${GCP_form_url}`, formSpec.forms[formId].onSuccess];
    // }

    // let prefilledForm = await getPrefillXML(...prefillXMLArgs);
    // setEncodedFormURI(prefilledForm);
  } else {
    setData(null);
  }
  loading.current = false;
};

export const getLocalTimeInISOFormat = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now - offset * 60 * 1000);
  return localTime.toISOString();
};

export const getOfflineCapableForm = async (formId) => {
  try {
    if (navigator.onLine) {
      let res = await axios.post(
        ENKETO_URL + "api/v2/survey/offline",
        {
          server_url: OPEN_ROSA_SERVER_URL,
          form_id: formId,
        },
        {
          headers: {
            Authorization: "Basic " + btoa("enketorules:"),
          },
        }
      );
      if (res?.data?.offline_url) {
        console.log("formUri is set to local forage", res?.data?.offline_url);
        // setToLocalForage('formUri', res?.data?.offline_url)
        await localforage.setItem("formUri", res?.data?.offline_url);
      }
      return res?.data?.offline_url || undefined;
    } else {
      let formUri = await localforage.getItem("formUri");
      console.log(formUri);
      return formUri;
    }
  } catch (err) {
    console.log(err);
  }
};
