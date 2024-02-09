import React, { useState, useEffect, useContext, useRef } from "react";
import { Routes, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import ROUTE_MAP from "../../routing/routeMap";
import { StateContext } from "../../App";
import XMLParser from "react-xml-parser";

import {
  getStatusOfForms,
  registerEvent,
  updateFormStatus,
  getPrefillXML,
  getEnketoFormData,
  assessorUpdateForm,
  updateFormSubmissions
} from "../../api";
import {
  getCookie,
  getFormData,
  updateFormData,
  removeItemFromLocalForage,
  getSpecificDataFromForage,
  getLocalTimeInISOFormat,
  getFromLocalForage,
  getOfflineCapableForm,
  setToLocalForage,
} from "../../utils";

import CommonLayout from "../../components/CommonLayout";
import CommonModal from "../../components/Modal";
import localforage from "localforage";

const ENKETO_MANAGER_URL = process.env.REACT_APP_ENKETO_MANAGER_URL;
const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
const GCP_URL = process.env.REACT_APP_GCP_AFFILIATION_LINK;
let previewFlag = false;

const GenericOdkForm = (props) => {
  const user = getCookie("userData");
  let { formName, date } = useParams();
  const scheduleId = useRef();
  const [isPreview, setIsPreview] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState("");
  const userId = user?.id;
  const [formDataFromApi, setFormDataFromApi] = useState();
  const [formStatus, setFormStatus] = useState("");
  const onlineInterval = useRef();
  let formSpec = {
    forms: {
      [formName]: {
        skipOnSuccessMessage: true,
        prefill: {},
        submissionURL: "",
        name: formName,
        successCheck: "async (formData) => { return true; }",
        onSuccess: {
          notificationMessage: "Form submitted successfully",
          sideEffect: "async (formData) => { console.log(formData); }",
        },
        onFailure: {
          message: "Form submission failed",
          sideEffect: "async (formData) => { console.log(formData); }",
          next: {
            type: "url",
            id: "google",
          },
        },
      },
    },
    start: formName,
    date: date,
    metaData: {},
  };

  const getFormURI = (form, ofsd, prefillSpec) => {
    return encodeURIComponent(
      `${ENKETO_MANAGER_URL}/prefillXML?formUrl=${form}&onFormSuccessData=${encodeFunction(
        ofsd
      )}&prefillSpec=${encodeFunction(prefillSpec)}`
    );
  };

  const navigate = useNavigate();
  const encodeFunction = (func) => encodeURIComponent(JSON.stringify(func));
  const startingForm = formSpec.start;
  const [formId, setFormId] = useState(startingForm);
  const [encodedFormSpec, setEncodedFormSpec] = useState(
    encodeURI(JSON.stringify(formSpec.forms[formId]))
  );
  const [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  const [onFormFailureData, setOnFormFailureData] = useState(undefined);
  const [encodedFormURI, setEncodedFormURI] = useState("");
  const [prefilledFormData, setPrefilledFormData] = useState();
  const [errorModal, setErrorModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const { state } = useContext(StateContext);
  const [formLoaded, setFormLoaded] = useState(false);
  const [dbInstantitated, setDBInstantiated] = useState(false);
  let courseObj = undefined;

  const loading = useRef(false);
  const [assData, setData] = useState({
    district: "",
    instituteName: "",
    nursing: "",
    paramedical: "",
    type: "",
    latitude: null,
    longitude: null,
  });


  const getDataFromLocal = async () => {
    const id = user?.id;
    let formData = await getFromLocalForage(
      `${formName}_${new Date().toISOString().split("T")[0]}`
    );

    let fileGCPPath = GCP_URL + formName + ".xml";

    let formURI = await getPrefillXML(
      `${fileGCPPath}`,
      formSpec.onSuccess,
      formData?.formData || formData?.form_data,
      formData?.imageUrls
    );

    setEncodedFormURI(formURI);
  };

  useEffect(() => {
    setTimeout(async () => {
      if(surveyUrl !== "") {
      await updateFormDataInEnketoIndexedDB();}
    }, 6000);
    // onlineInterval.current = setInterval(async () => {
      // if(surveyUrl !== "") {
      //  updateFormDataInEnketoIndexedDB();
      // }
    // }, 1000);
    // return () => clearInterval(onlineInterval.current);
  },[surveyUrl])


  /* fetch form data from API */
  const fetchFormData = async () => {
    let formData = {};
    let filePath =
      process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";
    const storedData = await getSpecificDataFromForage("required_data");
    let data = await getFromLocalForage(
      `${userId}_${formName}_${new Date().toISOString().split("T")[0]}`
    );
    const postData = { form_id: storedData?.applicant_form_id };
    try {
      const res = await getEnketoFormData(postData);
      formData = res.data.form_submissions[0];
      // setPaymentStatus(formData?.payment_status);
      const postDataEvents = { id: storedData?.applicant_form_id };
      // const events = await (postDataEvents);
      // setFormStatus(events?.events);
      setFormDataFromApi(res.data.form_submissions[0]);
      await setToLocalForage(
        `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
        {
          formData: formData?.form_data,
          imageUrls: { ...formData?.imageUrls },
        }
      );

      let formURI = await getPrefillXML(
        `${filePath}`,
        formSpec.onSuccess,
        formData?.form_data,
        formData?.imageUrls
      );
      setEncodedFormURI(formURI);
      return formData.form_data;
    } catch (error) {
      console.log(error);
    } finally {
      // setSpinner(false);
    }
  };

  const updateSubmissionForms = async (course_id) => {
    let submission_forms_arr = await getSpecificDataFromForage(
      "submission_forms_arr"
    );
    let formStatusCounter = 0;
    if (submission_forms_arr) {
      submission_forms_arr = Object.values(submission_forms_arr);
      submission_forms_arr = submission_forms_arr.map((elem) => {
        if (elem.course_id === course_id) {
          elem.form_status = true;
        }

        if (elem.form_status) {
          formStatusCounter++;
        }
        return elem;
      });
      setToLocalForage("submission_forms_arr", submission_forms_arr);
      updateApplicantForm(submission_forms_arr, formStatusCounter);
    }
  };

  const updateApplicantForm = async (forms_arr, counter) => {

    try {
      if (forms_arr.length === counter) {
        // call the event update function...
        await registerEvent({
          created_date: getLocalTimeInISOFormat(),
          entity_id: courseObj?.applicant_form_id.toString(),
          entity_type: "form",
          event_name: "OGA Completed",
          remarks: `${user?.firstName} ${user?.lasttName} has completed the On Ground Inspection Analysis`,
        });
  
        await updateFormStatus({
          form_id: courseObj.applicant_form_id,
          form_status: "OGA Completed",
        });
  
        await assessorUpdateForm({
          form_id: courseObj.applicant_form_id,
          form_status: "OGA Completed",
        });
  
      }
    } catch (error) {
      console.log("Something went wrong while updating form_status to OGA Completed ",error)
    }
  
  };

  const getSurveyUrl = async () => {
    let surveyUrl = await getOfflineCapableForm(formId);
    console.log("SurveyURL:", surveyUrl);
    if (!surveyUrl)
      setSurveyUrl(
        "https://8065-samagradevelop-workflow-871i2twcw0a.ws-us98.gitpod.io/x"
      );
    else setSurveyUrl(surveyUrl);
  };

  async function afterFormSubmit(e, saveFlag) {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    try {
      const { nextForm, formDataXml, onSuccessData, onFailureData } = data;
      // if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
          // For read-only forms, it will disable the Submit...
          if (date) {
            setErrorModal(true);
            return;
          }
          console.log("formDataXML =>", data);
          const updatedFormData = await updateFormData(formSpec.start, data?.formData.xml, data?.formData.files.fileURLs);
          const storedData = await getSpecificDataFromForage("required_data");

          const requestData = {
            form_id: storedData?.applicant_form_id,
            form_data: updatedFormData,
            form_name: formSpec.start,
            submission_status: saveFlag === "draft" ? false : true,
            form_status: saveFlag === "draft" ? "" : "In Progress",
            assessor_id: storedData?.assessor_user_id,
            applicant_id: storedData?.institute_id,
            applicant_form_id: courseObj["applicant_form_id"],
            course_id: courseObj["course_id"],
            submitted_on: new Date().toJSON().slice(0, 10),
            schedule_id: storedData?.schedule_id,
          } 
          const res = await updateFormSubmissions(requestData);
          if (res?.data?.update_form_submissions) {
            updateSubmissionForms(courseObj["course_id"]);

            // Delete the data from the Local Forage
            const key = `${storedData?.assessor_user_id}_${formSpec.start}_${
              new Date().toISOString().split("T")[0]
            }`;
            removeItemFromLocalForage(key);

            setPreviewModal(false);
            previewFlag = false;
            setTimeout(
              () => navigate(`${ROUTE_MAP.thank_you}${formName}`),
              1000
            );
        }
      // }
      if (nextForm?.type === "form") {
        setFormId(nextForm.id);
        setOnFormSuccessData(onSuccessData);
        setOnFormFailureData(onFailureData);
        setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
        setEncodedFormURI(
          getFormURI(
            nextForm.id,
            onSuccessData,
            formSpec.forms[nextForm.id].prefill
          )
        );
        navigate(
          formName.startsWith("hospital")
            ? ROUTE_MAP.hospital_forms
            : ROUTE_MAP.medical_assessment_options
        );
      } else if (nextForm?.type === "url") {
        window.location.href = nextForm.url;
      }
    } catch (e) {
      console.log(e);
    }
  }

  const handleFormLoadEvents = (e) => {
    if(typeof e.data === 'string' && e.data.includes('formLoad')) {
      setFormLoaded(true);
      return;
    }
  }

  const handleSubmissionEvents = (e) => {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    console.log("data ==>",data.message);
    if(data !== undefined && data.message === 'assessor-form-submitted') {
      handleFormEvents(startingForm, afterFormSubmit, e);
      return;
    }
    else {
      console.log("form not submitted");
    }
  }

  const handleEventTrigger = async (e) => {
    handleFormLoadEvents(e);
    handleSubmissionEvents(e);
  };

  const bindEventListener = () => {
    window.addEventListener("message", handleEventTrigger);
  };

  
  const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
    const user = getCookie("userData");
    const eventFormData =
    typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    const event = e;
    if (
      ((ENKETO_URL === `${event.origin}/enketo`) || (ENKETO_URL === `${event.origin}/enketo/`)) &&
      // e.origin === ENKETO_URL &&
      typeof event.data === "string" &&
      JSON.parse(event.data).state !== "ON_FORM_SUCCESS_COMPLETED"
    ) {
      var formDataObject = JSON.parse(event.data);
      if (formDataObject.formData) {
        let images = formDataObject.formData.files;
        let prevData = await getFromLocalForage(
          `${startingForm}_${new Date().toISOString().split("T")[0]}`
        );
        await setToLocalForage(
          `${user?.id}_${startingForm}_${
            new Date().toISOString().split("T")[0]
          }`,
          {
            formData: formDataObject.formData.xml,
            imageUrls: { ...prevData?.imageUrls, ...images },
          }
        );
      }
    }
    if(eventFormData?.formData?.draft !== "" &&
    eventFormData?.formData?.draft === true) {
        let db;
        const DBOpenRequest = window.indexedDB.open("enketo", 3);
        DBOpenRequest.onsuccess = (event) => {
          db = DBOpenRequest.result;
        
          // Clear all the data from the object store
          clearData(db);
        };
  
        //alert("Hello world!");
  
    }
    afterFormSubmit(event);
  };

  const detachEventBinding = () => {
    window.removeEventListener("message", handleEventTrigger);
  };

  const checkIframeLoaded = () => {
    if (window.location.host.includes("localhost")) {
      return;
    }

    const iframeElem = document.getElementById("enketo-form");
    var iframeContent =
      iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      var section = iframeContent?.getElementsByClassName("or-group");
      if (!section) return;
      for (var i = 0; i < section?.length; i++) {
        var inputElements = section[i].querySelectorAll("input");
        var buttonElements = section[i].querySelectorAll("button");
        buttonElements.forEach((button) => {
          if(date !== undefined) {
          button.disabled = true;
          iframeContent.getElementById("submit-form").style.display = "none";
          iframeContent.getElementById("save-draft").style.display = "none";
          }
        });
        inputElements.forEach((input) => {
          if(date !== undefined) {
          input.disabled = true;
          iframeContent.getElementById("submit-form").style.display = "none";
          iframeContent.getElementById("save-draft").style.display = "none";
          }
          // hide admin remarks
          if(input.name.toLowerCase().includes('admin') ) {
            input.previousSibling.style.display = 'none';
            input.style.display = 'none';
          }
        });

      // iframeContent.getElementById("submit-form").style.display = "none";
      // iframeContent.getElementById("save-draft").style.display = "none";
    }
  }
    // var draftButton = iframeContent.getElementById("save-draft");
    

    const clearData = (db) => {
      // open a read/write db transaction, ready for clearing the data
      const transaction = db?.transaction(["records"], "readwrite");
    
      // report on the success of the transaction completing, when everything is done
      // create an object store on the transaction
      const objectStore = transaction?.objectStore("records");
    
      // Make a request to clear all the data out of the object store
      const objectStoreRequest = objectStore?.clear();
    
      objectStoreRequest.onsuccess = (event) => {
        // report the success of our request
        console.log("cleared entry");
      };
    }

  const handleRenderPreview = () => {
    setPreviewModal(true);
    previewFlag = true;

    setTimeout(() => {
      const iframeElem = document.getElementById("preview-enketo-form");
      if (window.location.host.includes("localhost")) {
        return;
      }
      let iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;
      let section = iframeContent?.getElementsByClassName("or-group");
      if (!section) return;
      for (var i = 0; i < section?.length; i++) {
        var inputElements = section[i].querySelectorAll("input");
        var buttonElements = section[i].querySelectorAll("button");
        buttonElements.forEach((button) => {
          button.disabled = true;
        })
        inputElements.forEach((input) => {
          input.disabled = true;
        });
      }
      iframeContent.getElementById("save-draft").style.display = "none";
    }, 1500);
  };

  const getCourseFormDetails = async () => {
    let submission_forms_arr = await getSpecificDataFromForage(
      "submission_forms_arr"
    );
    if (submission_forms_arr) {
      submission_forms_arr = Object.values(submission_forms_arr);
      courseObj = submission_forms_arr.find(
        (obj) => obj.course_name === formName + ".xml"
      );
    }
  };

  const updateFormDataInEnketoIndexedDB = async () => {
    // fetch form data only if there is no drafted entry in DB 
    let formDataresp = await fetchFormData();
    
    let db;
    const splitURL = surveyUrl.split("/");
    const surveyInstance = splitURL[splitURL.length - 1];
    console.log("surveyInstance", surveyInstance);
    const req = window.indexedDB.open('enketo', 3);

    req.onsuccess = (e) => {
      // Create the DB connection
      db = req.result;
// trial error method
      const objectStore = db?.transaction(["records"], "readwrite")
      .objectStore("records");
      const enketodataStore = db?.transaction(["data"], "readwrite").objectStore("data");

      const enketoDataStoreDataRequest = enketodataStore.getAll();
    const objectStoreTitleRequest = objectStore.getAll();

    enketoDataStoreDataRequest.onSuccess = (e) => {
      const data = enketoDataStoreDataRequest.result;
      
      if(data.length > 0) {
        console.log("Hieeeee");
      }
      else {
        console.log("no enketo result found");
      }
    }

    objectStoreTitleRequest.onsuccess = (e) => {
      // Grab the data object returned as the result
      const data = objectStoreTitleRequest.result;
      let valueToBeUpdated = data[data.length - 1];
      if (valueToBeUpdated) {
        console.log("value =>", valueToBeUpdated);
        // console.log(valueToBeUpdated.xml)
        // valueToBeUpdated.xml = formDataresp;
        // console.log(valueToBeUpdated.xml)
        // Create another request that inserts the item back into the database
        const updateTitleRequest = objectStore.put(valueToBeUpdated);
        
        // Log the transaction that originated this request
        console.log(
          `The transaction that originated this request is ${updateTitleRequest.transaction}`,
        );
      } else {
        console.log(
          `Adding new entry to indexed DB`,
        );
        
        var request = indexedDB.open("enketo", 3); // first step is opening the database
        request.onsuccess = function (e) {
          var db = e.target.result;
          var trans = db.transaction(["records"], 'readwrite'); //second step is opening the object store
          var store = trans.objectStore("records");
          
          const autoSaveObj = {
            "instanceId": `__autoSave_${surveyInstance}`,
            "enketoId": `${surveyInstance}`,
            "name": `__autoSave_${Date.now()}`,
            "xml": formDataresp,
            "files": [],
            "created": Date.now(),
            "updated": Date.now(),
            "draft": true
          }

          var saveReq = store.put(autoSaveObj);

          saveReq.onsuccess = function (e) {
            setDBInstantiated(true);
            console.log("Success", e)
          };
          saveReq.onerror = function (e) {
            console.log('Error adding: ' + e);
          };
        };
      }

    }
    };
    // let formDataresp = '<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" id="Nursing Institutions_Technical_GNM_2" version="1"><username>username not found</username><start>2024-01-04T14:50:17.460+05:30</start><end>2024-01-04T14:50:23.929+05:30</end><today>2024-01-04</today><deviceid>affiliation.upsmfac.org:VrKFBg4TRAOGdDPR</deviceid><subscriberid>subscriberid not found</subscriberid><D><applicant_D1.1/><desktop_DA1.1/><assessor_R2.1>HHHHHHHHHH</assessor_R2.1><assessor_D2.2/><assessor_url1/><applicant_D1.4/><desktop_DA1.2/><assessor_D2.4/><assessor_url4/><assessor_R2.5/><applicant_D1.5/><desktop_DA1.3/><assessor_R5.5/><assessor_D5.5/><assessor_url5/><D1.6/><desktop_DA1.4/><assessor_R6.6/><assessor_D6.6/><assessor_url6/><applicant_D1.8/><applicant_url1/><desktop_DA1.5/><assessor_R6.7/><assessor_D7.7/><assessor_url7/><admin_YN1.1/><assessor_R10.10/></D><meta><instanceID>uuid:f275ac45-6d5b-4bcc-a0ea-7d6df2674466</instanceID></meta></data>'
    

  }



  useEffect(() => {
    bindEventListener();
    getSurveyUrl();
    getCourseFormDetails();
    fetchFormData();
    getDataFromLocal();
    getFormData({
      loading,
      scheduleId,
      formSpec,
      startingForm,
      formId,
      setData,
      setEncodedFormSpec,
      setEncodedFormURI,
    });
    return () => {
      detachEventBinding();
      setData(null);
      setPrefilledFormData(null);
    };
  }, []);

  useEffect(() => {
    if(formLoaded === true || dbInstantitated === true) {
      checkIframeLoaded();
    }
  }, [formLoaded, dbInstantitated])

  // useEffect(() => {
  //   if(surveyUrl !== "") {
      
  //   }
  // }, [surveyUrl])

  /* 
  async function fetchIframeResources(iframeUrl) {
    try {
      const response = await fetch(iframeUrl);
      const text = await response.text();
      console.log(text); // The fetched content of the iframe
  
      // You can further process the fetched content as needed
    } catch (error) {
      console.error('Error fetching iframe resources:', error);
    }
  }
  
  setTimeout(() => {
    // Call the function with the URL of the iframe's content
    fetchIframeResources('https://enketo.upsmfac.org/enketo/preview?formSpec=%7B%22skipOnSuccessMessage%22:true,%22prefill%22:%7B%7D,%22submissionURL%22:%22%22,%22name%22:%22bsc_nursing_p7%22,%22successCheck%22:%22async%20(formData)%20=%3E%20%7B%20return%20true;%20%7D%22,%22onSuccess%22:%7B%22notificationMessage%22:%22Form%20submitted%20successfully%22,%22sideEffect%22:%22async%20(formData)%20=%3E%20%7B%20console.log(formData);%20%7D%22%7D,%22onFailure%22:%7B%22message%22:%22Form%20submission%20failed%22,%22sideEffect%22:%22async%20(formData)%20=%3E%20%7B%20console.log(formData);%20%7D%22,%22next%22:%7B%22type%22:%22url%22,%22id%22:%22google%22%7D%7D%7D&xform=https://formmanager.upsmfac.org/form/instance/48637fc6-d572-4700-a223-34582ce38538&userId=997e23bb-6801-44a1-aeb4-c3e526a85574');
    }, 2000); */

  return (
    <>
    <CommonLayout
      {...props.commonLayoutProps}
     // formUrl={`${ENKETO_URL}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}&userId=${user?.id}`}
     formUrl = {surveyUrl} 
     formPreview={true}
      setIsPreview={setIsPreview}
    >
      {!isPreview && (
        <div className="flex flex-col items-center">
          {encodedFormURI && date!== undefined && (
            <>
              <iframe
                title="form"
                id="enketo-form"
                src={`${ENKETO_URL}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}&userId=${user?.id}`}
                style={{ height: "80vh", width: "100%" }}
              />
            </>
          )}
        </div>
      )}

      {(surveyUrl !=="" && date === undefined) && (
        <>
          <iframe
            id="offline-enketo-form"
            title="form"
            src={surveyUrl}
            style={{ height: "80vh", width: "100%", marginTop: "20px" }}
          />
        </>
      )}
    </CommonLayout>

    {errorModal && (
      <CommonModal>
        <div>
          <p className="text-secondary text-2xl lg:text-3xl text-semibold font-medium text-center">
            Error!
          </p>
          <div className="flex flex-row justify-center w-full py-4 text-center">
            You can't submit a Preview form.
          </div>
          <div className="flex flex-row justify-center w-full py-4">
            <div
              className="border border-primary bg-primary text-white py-1 px-7 cursor-pointer lg:px-16 lg:py-3 lg:text-xl"
              onClick={() => setErrorModal(false)}
            >
              Close
            </div>
          </div>
        </div>
      </CommonModal>
    )}

    {previewModal && (
      <CommonModal
        moreStyles={{
          padding: "1rem",
          maxWidth: "95%",
          minWidth: "90%",
          maxHeight: "90%",
        }}
      >
        <div className="flex flex-row w-full items-center cursor-pointer gap-4">
          <div className="flex flex-grow font-bold text-xl">
            Preview and Submit form
          </div>
          <div className="flex flex-grow justify-end">
            <FontAwesomeIcon
              icon={faXmark}
              className="text-2xl lg:text-4xl"
              onClick={() => {
                setPreviewModal(false);
                previewFlag = false;
              }}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center w-full py-4">
          {surveyUrl && (
            <iframe
              title="form"
              id="preview-enketo-form"
              src={`${ENKETO_URL}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}&userId=${user?.id}`}
              style={{ height: "80vh", width: "100%", marginTop: "20px" }}
            />
          )}
        </div>
      </CommonModal>
    )}
  </>
  );
};

export default GenericOdkForm;