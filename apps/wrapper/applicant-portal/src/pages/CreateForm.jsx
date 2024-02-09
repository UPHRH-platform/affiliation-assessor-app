import React, { useEffect, useState, useRef, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import XMLParser from "react-xml-parser";
import { applicationService } from "../services";

import {
  FaAngleRight,
  FaArrowLeft,
  FaFileDownload,
  FaDownload,
  FaRegTimesCircle,
} from "react-icons/fa";

import paymentConfigPostData from "../payment-config/config.json";

import {
  getCookie,
  getFromLocalForage,
  setToLocalForage,
  updateFormData,
  getSpecificDataFromForage,
  removeAllFromLocalForage,
  removeItemFromLocalForage,
} from "./../forms";

import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";
import { setCookie } from "../utils";
import { Button, Card } from "../components";
import CommonModal from "../Modal";
import Toast from "../components/Toast";
import "./loading.css";

import {
  getFormData,
  base64ToPdf,
  getLocalTimeInISOFormat,
  saveApplicationDraft,
  updateApplicationDraft,
  deleteApplicationDraft,
} from "../api";
import {
  getPrefillXML,
  saveFormSubmission,
  getFormURI,
  updateFormSubmission,
} from "../api/formApi";
import { generate_uuidv4 } from "../utils";
import { applicantService } from "../services";
import { ContextAPI } from "../utils/contextAPI";
import StatusLogModal from "./StatusLogModal";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
let previewFlag = false;
let isFormInPreview = false;
let ogaRevertedCount = 0;

const CreateForm = (props) => {
  const navigate = useNavigate();
  let { formName, formId, applicantStatus, paymentStage } = useParams();
  let [encodedFormURI, setEncodedFormURI] = useState("");
  let [paymentDetails, setPaymentDetails] = useState("");
  let [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  let [formDataNoc, setFormDataNoc] = useState({});
  let [onFormFailureData, setOnFormFailureData] = useState(undefined);
  let [isDownloading, setIsDownloading] = useState(false);
  let [previewModal, setPreviewModal] = useState(false);
  let [formLoaded, setFormLoaded] = useState(false);
  const { setToast } = useContext(ContextAPI);

  // Spinner Element
  const spinner = document.getElementById("backdrop");

  const [assData, setData] = useState({
    district: "",
    instituteName: "",
    nursing: "",
    paramedical: "",
    type: "",
    latitude: null,
    longitude: null,
  });
  const [onSubmit, setOnSubmit] = useState(false);
  const [reloadForm, setReloadForm] = useState(true);

  const userId = getCookie("userData")?.id;
  const instituteDetails = getCookie("institutes");
  const [openStatusModel, setOpenStatusModel] = useState(false);

  const formSpec = {
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
    start: formName,
    formId: formId,
  };

  const startingForm = formSpec.start;
  const [encodedFormSpec, setEncodedFormSpec] = useState(
    encodeURI(JSON.stringify(formSpec?.formId))
  );
  const iframeRef = useRef(null);

  const fetchFormData = async () => {
    let formData = {};

    let data = await getFromLocalForage(
      `${userId}_${formName}_${new Date().toISOString().split("T")[0]}`
    );
    if (data) {
      formData = data;
    } else {
      if (formId !== undefined) {
        const postData = { form_id: formId };
        const res = await getFormData(postData);
        formData = res?.data?.form_submissions[0];
        ogaRevertedCount = formData?.oga_reverted_count;
        await setToLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
          {
            formData: formData.form_data,
            imageUrls: { ...formData.imageUrls },
          }
        );
        setPaymentDetails(formData?.payment_status);
        setFormDataNoc(formData);
      }
    }

    let fileGCPPath =
      process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";

    let formURI = await getPrefillXML(
      `${fileGCPPath}`,
      formSpec.onSuccess,
      formData?.formData || formData?.form_data,
      formData?.imageUrls
    );
    setEncodedFormURI(formURI);
  };

  const getDraftApplicationDetail = async (id) => {
    let formData = {};
    let data = await getFromLocalForage(
      `${userId}_${formName}_${new Date().toISOString().split("T")[0]}`
    );
    if (data) {
      formData = data;
    } else {
      const requestPayload = {
        searchString: {
          applicant_id: {
            _eq: instituteDetails?.[0].id || 11,
          },
          id: {
            _eq: id,
          },
        },
        offsetNo: 0,
        limit: 100,
      };
      const draftApplicationResponse = await applicationService.getDraftForms(
        requestPayload
      );
      // console.log("response =>", draftApplicationResponse);
      formData = draftApplicationResponse?.data?.institute_form_drafts[0];
      // setPaymentDetails(formData?.payment_status);
      await setToLocalForage(
        `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
        {
          formData: formData.form_data,
          imageUrls: { ...formData.imageUrls },
        }
      );
      setFormDataNoc(formData);
    }

    let fileGCPPath =
      process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";

    let formURI = await getPrefillXML(
      `${fileGCPPath}`,
      formSpec.onSuccess,
      formData?.formData || formData?.form_data,
      formData?.imageUrls
    );
    setEncodedFormURI(formURI);
  };

  const initiatePaymentForNewForm = async () => {
    try {
      const payloadFromForage = await getFromLocalForage(`common_payload`);
      // console.log(payloadFromForage)

      let reqBody = {
        object: {
          form_data: payloadFromForage.common_payload.form_data,
          form_name: payloadFromForage.common_payload.form_name,
          assessment_type: payloadFromForage.common_payload.form_name,
          submission_status: true,
          applicant_id: instituteDetails?.[0]?.id,
          form_status: "Initial Draft",
          round: payloadFromForage.common_payload.round,
          course_type: payloadFromForage.common_payload.course_type,
          course_level: payloadFromForage.common_payload.course_level,
          course_id: payloadFromForage.common_payload.course_id,
          payment_status: "Pending",
        },
      };
      await applicantService.saveInitialFormSubmission(reqBody);

      paymentConfigPostData.created_by = userId;

      const paymentRes = await applicantService.initiatePaymentForNewForm(
        paymentConfigPostData
      );
      await setToLocalForage(`refNo`, {
        refNo: paymentRes?.data?.referenceNo,
      });
      //  await applicantService.savePaymentRefNumber(paymentRes?.data?.referenceNo);
      window.open(paymentRes?.data?.redirectUrl);
      //  window.location.replace(paymentRes?.data?.redirectUrl)
    } catch (error) {
      console.log(error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg:
          "Payment gateway seems to be not responding. Please try again later.",
        toastType: "error",
      }));
    }
  };

  const afterFormSubmit = async (e) => {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

    try {
      const { nextForm, formData, onSuccessData, onFailureData } = data;

      if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
        isFormInPreview = true;
        if (!previewFlag) {
          if (applicantStatus !== "draft" || applicantStatus === undefined) {
            await fetchFormData();
          } else {
            getDraftApplicationDetail();
          }
          handleRenderPreview();
        } else {
          console.log("aaaaaa");
          console.log(applicantStatus);
          handleSubmit();
        }
      }

      if (nextForm?.type === "form") {
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
      } else if (nextForm?.type === "url") {
        window.location.href = nextForm.url;
      }
    } catch (e) {
      console.log(e);
    }
  };

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
        });
        inputElements.forEach((input) => {
          input.disabled = true;
        });
      }
      iframeContent.getElementById("save-draft").style.display = "none";
    }, 3000);
  };

  const handleSubmit = async () => {
    const updatedFormData = await updateFormData(formSpec.start, userId);
    console.log("updatedFormData ====>", updatedFormData);
    const course_details = await getSpecificDataFromForage("course_details");
    console.log(course_details);
    const common_payload = {
      form_data: updatedFormData,
      assessment_type: "applicant",
      form_name: formName,
      submission_status: true,
      round: course_details?.round,
      course_type: course_details?.course_type,
      course_level: course_details?.course_level,
      course_id: course_details?.course_id || course_details?.course?.course_id,
      reverted_count: course_details?.reverted_count,
    };

    await setToLocalForage(`common_payload`, {
      formSpecstart: formSpec.start,
      userId,
      common_payload,
      paymentStage: "firstStage",
      formId,
    });

    console.log(common_payload);
    if (!applicantStatus) {
      initiatePaymentForNewForm();
    } else {
      triggerFormSubmission();
    }
  };

  const triggerFormSubmission = async () => {
    const formDATA = await getFromLocalForage(`common_payload`);
    try {
      const commonPayload = formDATA?.common_payload;
      if (applicantStatus === "draft" || applicantStatus === "undefined") {
        //new form
        console.log("Saving new form..");
        console.log(commonPayload);
        const response = await saveFormSubmission({
          schedule_id: null,
          assessor_id: null,
          applicant_id: instituteDetails?.[0]?.id,
          submitted_on: new Date().toJSON().slice(0, 10),
          reverted_count: 0,
          form_status:
            commonPayload.round === 1
              ? "Application Submitted"
              : "DA Completed",
          ...commonPayload,
        });
        // console.log(response);
        // if the application is drafted, remove it's entry post form submission
        if (response) {
          // form submission success message 
          const draft = await getFromLocalForage("draft");
          console.log("draft ===>", draft);
          if (draft && draft.draftId !== "") {
            const request = {
              id: draft.draftId,
            };
            console.log("req", request);
            try {
              await deleteApplicationDraft(request);
              removeItemFromLocalForage("draft");        
            } catch (error) {
              console.log("error =>", error);
            }
          }
          isFormInPreview = false;
              setOnSubmit(false);
              setToast((prevState) => ({
                ...prevState,
                toastOpen: true,
                toastMsg: "Form Submitted Successfully!.",
                toastType: "success",
              }));
        
              setTimeout(
                () =>
                  navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`),
                1500
              );
          //  await removeAllFromLocalForage();
        }
        console.log(
          response?.data?.insert_form_submissions?.returning[0]?.form_id
        );
        const tempStore = await getFromLocalForage(`refNo`);
        //  console.log(tempStore.refNo)
        const reqBody = {
          refNo: tempStore.refNo,
          status: "Paid",
          formId:
            response?.data?.insert_form_submissions?.returning[0]?.form_id,
        };

        await applicantService.updateTransactionStatusByRefNo(reqBody);
      } else {
      /*   await updateFormSubmission({
          form_id: formId,
          applicant_id: instituteDetails?.[0]?.id,
          updated_at: getLocalTimeInISOFormat(),
          form_status: "Resubmitted",
          ...commonPayload,
        });
        removeAllFromLocalForage(); */
      let thisFormStatus = "";
      ogaRevertedCount > 0 ? thisFormStatus = "OGA Completed" : thisFormStatus = "Resubmitted";
      console.log("ogaRevertedCount===>", ogaRevertedCount)
      await updateFormSubmission({
        form_id: formId,
        applicant_id: instituteDetails?.[0]?.id,
        updated_at: getLocalTimeInISOFormat(),
        form_status: thisFormStatus, //"Resubmitted",
        ...commonPayload,
      });
  // Delete the form and course details data from the Local Forage
      removeAllFromLocalForage();
      }
    
      isFormInPreview = false;
      setOnSubmit(false);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form Submitted Successfully!.",
        toastType: "success",
      }));

      setTimeout(
        () =>
          navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`),
        1500
      );
    } catch (error) {
      console.log("Something went wrong", error);
    }
  };

  const handleDownloadNocOrCertificate = () => {
    //console.log(formDataNoc)
    let url = "";
    if (formDataNoc.round == 1) {
     // window.open(formDataNoc?.noc_Path, "_blank");
      url = formDataNoc?.noc_Path
    } else {
    //  window.open(formDataNoc?.certificate_Path, "_blank");
    url = formDataNoc?.certificate_Path
    }
    const filename = formDataNoc?.certificate_fileName || formDataNoc?.noc_fileName;
 
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobURL;
        a.style.display = "none";
 
        if (filename && filename.length !== 0) {
          a.download = filename;
        }
        document.body.appendChild(a);
        a.click();
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg:
            "NOC / Certificate downloaded successfully.",
          toastType: "success",
        }));
      })
      .catch((error) => {
        console.error(error);
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg:
            "Failed to download NOC / Certificate. Please try again later.",
          toastType: "error",
        }));
      });
  };

  const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
    const eventFormData =
      typeof e.data === "string" ? JSON.parse(e.data) : e.data;

    //console.log("event =>", e);
    // if(applicantStatus === 'draft' && (eventFormData?.formData !== undefined && eventFormData?.formData?.instance !== "formLoad")) {
    //   let fileGCPPath =
    //   process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";

    // let formURI = await getPrefillXML(
    //   `${fileGCPPath}`,
    //   formSpec.onSuccess,
    //   eventFormData.formData,
    //   eventFormData?.fileURLs
    // );
    // setEncodedFormURI(formURI);
    // }
    if (
      eventFormData?.formData?.draft !== "" &&
      eventFormData?.formData?.draft === true
    ) {
      const course_details = await getSpecificDataFromForage("course_details");
      console.log("courseDetails ===>", course_details);
      const requestBody = {
        object: {
          applicant_id: instituteDetails?.[0]?.id,
          form_status: "Draft",
          form_name: formName,
          assessment_type: course_details?.form?.assignee,
          round: course_details?.form?.round,
          course_type: course_details?.course_type,
          course_level: course_details?.course_level,
          course_name: course_details?.form?.course_mapping,
          course_id: course_details?.course_id,
          // updated_by: userId,
          created_by: userId,
          form_data: eventFormData?.formData?.xml,
          // form_id: course_details?.form?.form_id,
          created_at: new Date().toJSON().slice(0, 10),
        },
      };
      if (formId !== undefined) {
        const requestBody = {
          id: formId,
          formData: eventFormData?.formData?.xml,
        };
        const res = await updateApplicationDraft(requestBody);
        if (res) {
          console.log("record saved as draft");
          setTimeout(
            () =>
              navigate(
                `${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`
              ),
            1500
          );
          // to remove all data from local forage
          removeAllFromLocalForage();
        }
      } else {
        const res = await saveApplicationDraft(requestBody);
        if (res) {
          console.log("record saved as draft");
          setTimeout(
            () =>
              navigate(
                `${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`
              ),
            1500
          );
          // to remove all data from local forage
          removeAllFromLocalForage();
        }
      }

      return;
    }
    if (typeof e.data === "string" && e.data.includes("formLoad")) {
      setFormLoaded(true);
      return;
    }
    if (typeof e.data === "string" && e.data.includes("webpackHot")) {
      return;
    }
    if (
      (ENKETO_URL === `${e.origin}/enketo` ||
        ENKETO_URL === `${e.origin}/enketo/`) &&
      // ENKETO_URL === e.origin  &&
      typeof e?.data === "string" &&
      JSON.parse(e?.data)?.state !== "ON_FORM_SUCCESS_COMPLETED" &&
      !isFormInPreview
    ) {
      var formData = new XMLParser().parseFromString(
        JSON.parse(e.data).formData
      );
      if (formData) {
        let images = JSON.parse(e.data).fileURLs;

        // let prevData = await getFromLocalForage(
        //   `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`
        // );
        await setToLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
          {
            formData: JSON.parse(e.data).formData,
            imageUrls: { ...images },
          }
        );
      }
    }
    afterFormSubmit(e);
  };

  const handleEventTrigger = async (e) => {
    handleFormEvents(startingForm, afterFormSubmit, e);
  };

  const bindEventListener = () => {
    window.addEventListener("message", handleEventTrigger);
  };

  const handleGoBack = () => {
    removeAllFromLocalForage();
    navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`);
  };

  const handleFormDownload = async () => {
    try {
      setIsDownloading(true);
      const formUrl = `${ENKETO_URL}/preview?formSpec=${encodeURI(
        JSON.stringify(formSpec)
      )}&xform=${encodedFormURI}&userId=${userId}`;
      const res = await base64ToPdf(formUrl);

      const linkSource = `data:application/pdf;base64,${res.data}`;
      const downloadLink = document.createElement("a");
      const fileName = "enketo_form.pdf";
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.target = window.safari ? "" : "_blank";
      downloadLink.click();
      setIsDownloading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIframeLoaded = () => {
    if (spinner) {
      spinner.style.display = "none";
    }

    if (window.location.host.includes("applicant.upsmfac")) {
      const iframeElem = document.getElementById("enketo-applicant-form");
      var iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;
      if (applicantStatus && applicantStatus?.toLowerCase() !== "draft") {
        iframeContent.getElementById("save-draft").style.display = "none";
      }
      if (
        applicantStatus &&
        applicantStatus?.toLowerCase() !== "draft" &&
        applicantStatus?.toLowerCase() !== "returned"
      ) {
        iframeContent.getElementById("submit-form").style.display = "none";
      }
      if (
        applicantStatus &&
        applicantStatus?.toLowerCase() !== "returned" &&
        applicantStatus.toLowerCase() !== "draft"
      ) {
        var section = iframeContent?.getElementsByClassName("or-group");
        if (!section) return;
        for (var i = 0; i < section?.length; i++) {
          var inputElements = section[i].querySelectorAll("input");
          var buttonElements = section[i].querySelectorAll("button");
  
          buttonElements.forEach((button) => {
            button.disabled = true;
          });
          inputElements.forEach((input) => {
            input.disabled = true;  
          });
        }        
      }
      if (applicantStatus && applicantStatus?.toLowerCase() === "returned") {
        var formSection = iframeContent?.getElementsByClassName("or-group");
        if (!formSection) return;
        // case radio elements
        for (var j = 0; j < formSection?.length; j++) {
          const inputElements1 = formSection[j].querySelectorAll("input");
          var buttonElements1 = formSection[j].querySelectorAll("button");

          buttonElements1.forEach((button) => {
            button.disabled = true;
          });
          // const buttonElements1 = formSection[j].querySelectorAll("button");
          // const selectElements1 = formSection[j].querySelectorAll("select");
          inputElements1.forEach((input) => {
            input.disabled = true;
            if (
              input?.type === "radio"
            ) {
              if(input?.name?.toLowerCase().includes("desktop") &&
              input?.value.toLowerCase() === "reject" &&
              input.checked === true) {
                const parentElement = input.parentNode.parentNode.parentNode;
                const previousSiblingElement = parentElement.parentNode.previousSibling;
              if (previousSiblingElement) {
                const children = previousSiblingElement.children;
                console.log("children =>", children);
                for (let k = 0; k < children.length; k++) {
                  if (
                    children[k].name !== undefined &&
                    children[k].name?.includes("applicant")
                  ) {
                    if(children[k].tagName.toLowerCase() === 'select') {
                      if (children[k + 1]) {
                        const firstChild = children[k + 1].children[0];
                        firstChild.disabled = false;
                      }
                      else {
                        const firstChild = children[k + 1].children[0];
                        firstChild.disabled = true;
                      }
                    }
                    else if(children[k].tagName.toLowerCase() === 'input') {
                      if(children[k].name.includes('applicant_url')) {
                        const parentNode = children[k].parentNode;
                        const sibling = parentNode.previousSibling;
                        if(sibling) {
                         const children = sibling.children;
                         for(let l = 0; l < children.length; l++) {
                          if(children[l].tagName === 'INPUT') {
                            children[l+1].children[0].disabled = false;
                          }
                         }
                        }
                      }
                      children[k].disabled = false;
                  }
                  }
                }
              }
            }
            else {
              input.disabled = true;
            }
          }
          });
        }
        // optionElement styling 
        var optionElements = iframeContent.getElementsByClassName('option-label');
        if (!optionElements) return;
        for(var k = 0; k < optionElements.length; k++ ) {
          optionElements[k].style.color = '#333333';
        } 
      
      }
      // disabling input fields in fresh form
      // if(formId === undefined) {
      //   var section1 = iframeContent?.getElementsByClassName("or-group");
      //   for (let j = 0; j < section1?.length; j++) {
      //     const inputElements1 = section1[j].querySelectorAll("input");
        
      //   inputElements1.forEach((input) => {
      //     if(input?.name?.toLowerCase().includes('desktop')) {
      //       input.previousSibling.style.display = 'none';
      //       input.style.display = 'none';
  
      //     }
      //     if(input?.type === 'radio' && (input?.name?.toLowerCase().includes('desktop'))) {
      //       const parentNode = input?.parentNode?.parentNode;
      //       parentNode.style.display = 'none';
      //       parentNode.previousSibling.style.display = 'none';
      //     }
      //   })
      // }
      // }

      // Need to work on Save draft...
      // iframeContent.getElementById("save-draft").style.display = "none";
      // var draftButton = iframeContent.getElementById("save-draft");
    }
  };

  useEffect(() => {
    if (applicantStatus === "draft") {
      setDraftIdToLocal();
      const draftApplicationId = formId;
      getDraftApplicationDetail(draftApplicationId);
    } else {
      fetchFormData();
    }
    bindEventListener();
    if (spinner) {
      spinner.style.display = "flex";
    }

    // To clean all variables
    return () => {
      previewFlag = false;
      // removeAllFromLocalForage();
      window.removeEventListener("message", handleEventTrigger);
    };
  }, []);

  const setDraftIdToLocal = async () => {
    await setToLocalForage(`draft`, {
      draftId: formId,
    });
  };

  useEffect(() => {
    if (formLoaded === true) {
      checkIframeLoaded();
    }
  }, [formLoaded]);

  useEffect(() => {
    console.log(paymentStage);
    if (paymentStage === "firstStage") {
      triggerFormSubmission();
    }
  }, [paymentStage]);

  return (
    <div>
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={APPLICANT_ROUTE_MAP.dashboardModule.my_applications}>
              <div className="text-primary-400 flex flex-row gap-2">
                <div className="flex items-center">
                  <FaArrowLeft className="text-[16px]" />
                </div>
                My Applications
              </div>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500">Create form</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-row justify-between">
          <div className="flex flex-grow gap-3 justify-end">
            <button
              onClick={handleGoBack}
              className="bg-gray-100 py-2 mb-8 font-medium rounded-[4px] px-2 text-blue-900 border border-gray-500 flex flex-row items-center gap-3"
            >
              Back to my application done
            </button>

            {applicantStatus !== "draft" && (
              <>
                <button
                  onClick={() => setOpenStatusModel(true)}
                  className="bg-gray-100 py-2 mb-8 font-medium rounded-[4px] px-2 text-blue-900 border border-gray-500 flex flex-row items-center gap-3"
                >
                  View status log
                </button>

                <button
                  onClick={handleDownloadNocOrCertificate}
                  disabled={
                    formDataNoc.form_status !== "Approved" ? true : false
                  }
                  className={`${
                    formDataNoc.form_status !== "Approved"
                      ? "cursor-not-allowed border border-gray-500 bg-white rounded-[4px] text-gray-200 px-2 h-[44px]"
                      : "border border-blue-900 bg-blue-900 text-white rounded-[4px] px-2 h-[44px]"
                  }`}
                >
                  Download NOC / Certificate
                </button>
              </>
            )}
          </div>
        </div>
        {openStatusModel && (
          <StatusLogModal
            closeStatusModal={setOpenStatusModel}
            formId={formId}
          />
        )}

        <Card moreClass="shadow-md">
          <div className="flex flex-col gap-5">
            <div className="flex flex-grow gap-3 justify-end">
              <button
                className={`bg-primary-900 py-3 font-medium rounded-[4px] px-6 text-white flex flex-row items-center gap-3 ${
                  isDownloading ? "cursor-not-allowed" : ""
                }  `}
                onClick={handleFormDownload}
                disabled={isDownloading}
              >
                <FaFileDownload />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </button>
            </div>
            <div className="flex">
              {paymentStage === undefined && encodedFormURI !== "" && (
                <iframe
                  id="enketo-applicant-form"
                  title="form"
                  ref={iframeRef}
                  onLoad={checkIframeLoaded}
                  src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                    JSON.stringify(formSpec)
                  )}&xform=${encodedFormURI}&userId=${userId}`}
                  style={{ minHeight: "100vh", width: "100%" }}
                />
              )}
            </div>
          </div>
        </Card>

        {onSubmit && (
          <CommonModal>
            <p className="text-secondary text-2xl text-semibold font-medium text-center">
              Once form is submitted, it cannot be modified! Are you sure, do
              you want to submit?
            </p>

            <div className="flex flex-row justify-center w-full py-4 gap-5">
              <div
                className="border border-primary bg-primary py-3 px-8 rounded-[4px] cursor-pointer items-center"
                onClick={() => setOnSubmit(false)}
              >
                No
              </div>
              <div
                className="bg-primary-900 py-3 rounded-[4px] px-8 text-white items-center gap-3 border border-primary py-3 px-7 cursor-pointer"
                onClick={() => handleSubmit()}
              >
                Yes! Submit
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
              <div className="flex flex-grow gap-3 justify-end items-center">
                {!isDownloading && (
                  <div onClick={handleFormDownload}>
                    <FaDownload className="text-[36px]" />
                  </div>
                )}
                {isDownloading && <div className="loader"></div>}

                <FaRegTimesCircle
                  className="text-[36px]"
                  onClick={() => {
                    isFormInPreview = false;
                    previewFlag = false;
                    setPreviewModal(false);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col justify-center w-full py-4">
              <iframe
                title="form"
                id="preview-enketo-form"
                src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                  JSON.stringify(formSpec)
                )}&xform=${encodedFormURI}&userId=${userId}`}
                style={{ height: "80vh", width: "100%" }}
              />
            </div>
          </CommonModal>
        )}
      </div>
    </div>
  );
};

export default CreateForm;