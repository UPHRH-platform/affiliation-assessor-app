import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AiOutlineClose, AiOutlineCheck } from "react-icons/ai";
import { FaAngleRight,FaFileDownload  } from "react-icons/fa";
import { Card, Button } from "./../../components";
import XMLParser from "react-xml-parser";

import StatusLogModal from "./StatusLogModal";
import IssueNocModal from "./IssueNocModal.jsx";
import RejectNocModal from "./RejectNocModal";
import OGASidebar from "./OGASidebar";
import CommonModal from "./../../Modal";
import {  Tooltip } from "@material-tailwind/react";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import {
  getFormData,
  fetchOGAFormsList,
  getRejectApplicant,
  getAcceptApplicantNoc,
  getAcceptApplicantCertificate,
  registerEvent,
  updateFormStatus,
  updateFormStatusForOGA,
  base64ToPdf,
  sendEmailNotification
} from "../../api";
import {
  getFromLocalForage,
  setToLocalForage,
} from "../../forms";
import { getPrefillXML } from "./../../api/formApi";
import { ContextAPI } from "../../utils/ContextAPI";
import { getCookie, getLocalTimeInISOFormat } from "../../utils";
import { Fragment } from "react";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
const GCP_URL = process.env.REACT_APP_GCP_AFFILIATION_LINK;


export default function ApplicationPage({
  closeModal,
  closeRejectModal,
  closeStatusModal,
  closeCertificateModal,
}) {
  const reportTemplateRef = useRef(null);
  
  const [formStatus, setFormStatus] = useState("");
  const [formDataFromApi, setFormDataFromApi] = useState();
  const [rejectModel, setRejectModel] = useState(false);
  const [rejectStatus, setRejectStatus] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const [openStatusModel, setOpenStatusModel] = useState(false);
  const [openIssueNocModel, setOpenIssueNocModel] = useState(false);
  let { formName, formId, instituteName, round, date } = useParams();
  let [instituteId, setInstituteId] = useState();
  let [selectRound, setSelectRound] = useState(round);
  let [enabler, setEnabler] = useState(0);
  let [ogaLisCount, setOgaLisCount] = useState(0);
  let [OGAFormsList, setOGAFormsList] = useState([]);
  let [formSelected, setFormSelected] = useState();
  const { setSpinner, setToast } = useContext(ContextAPI);
  const userDetails = getCookie("userData");
  const [formLoaded, setFormLoaded] = useState(false);
  let [isDownloading, setIsDownloading] = useState(false);
  const [onSubmit, setOnSubmit] = useState(false);
  const [ogaRevertedCount, setOgaRevertedCount] = useState(0);
 // let enketoFormSubmitButton = "";
  let isFormSubmittedForConfiirmation = false;
  const navigation = useNavigate();


  const userId = "427d473d-d8ea-4bb3-b317-f230f1c9b2f7";
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
  };
  const [encodedFormURI, setEncodedFormURI] = useState(JSON.stringify(formSpec.formId));
  const startingForm = formSpec.start;

  const setIframeFormURI = async (formDataObj) => {
    console.log("formDataObj------",formDataObj)
    const form_path = `${GCP_URL}${formDataObj?.form_name}.xml`;
    let formURI = await getPrefillXML(
      `${form_path}`,
      "",
      formDataObj?.form_data,
      formDataObj?.imageUrls
    );

    
   // ogaRevertedCount = formDataFromApi?.oga_reverted_count;
    console.log("oga_reverted_count******************",ogaRevertedCount)
    setEncodedFormURI(formURI);
  };

  const fetchFormData = async () => {
    const postData = { form_id: formId };
    try {
      const res = await getFormData(postData);
      const formData = res.data.form_submissions[0];
      setFormDataFromApi(res.data.form_submissions[0]);
      const statusOfForm = formData?.form_status;
     // ogaRevertedCount = formData?.oga_reverted_count;
      setOgaRevertedCount(formData?.oga_reverted_count)
      console.log("FormDataFromApi------",res.data.form_submissions[0])
      setFormStatus(statusOfForm);
      setInstituteId(formData?.institute?.id);
      setIframeFormURI(formData);
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  
  
  const handleFormReturnSubmit = async () => {
    isFormSubmittedForConfiirmation = false;
    setOnSubmit(false);
    try {
      //console.log(formDataFromApi)
     // ogaRevertedCount = formDataFromApi.oga_reverted_count;
      await updateFormStatusForOGA({
        form_id: formSelected.form_id * 1,
        form_status: "Returned",
        date: new Date().toISOString().substring(0, 10),
        oga_reverted_count: ogaRevertedCount + 1
      });
      
      //email notify

      if (formDataFromApi?.institute?.email) {
        const emailData = {
          recipientEmail: [`${formDataFromApi?.institute?.email}`],
          emailSubject: `Application Returned!`,
          emailBody: `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Your Email Title</title><link href='https://fonts.googleapis.com/css2?family=Mulish:wght@400;600&display=swap' rel='stylesheet'></head><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 20px; text-align: center; background-color: #F5F5F5;'><img src='https://regulator.upsmfac.org/images/upsmf.png' alt='Logo' style='max-width: 360px;'></td></tr></table><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 36px;'><p style='color: #555555; font-size: 18px; font-family: 'Mulish', Arial, sans-serif;'>Dear ${formDataFromApi?.institute?.name},</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We hope this email finds you well. We are writing to kindly request the resubmission of your application for the affiliation process. We apologize for any inconvenience caused, but it appears that there was an issue with the initial submission, and we did not receive the full information for proceeding to next steps.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We kindly request that you resubmit your application using the following steps:
            <p>1. Please find your Returned application in the application inbox.</p>
            <p>2. You can open the Returned application to view the returning officer's comments. The comments will help you to understand the gaps and bridge them.</p>
            <p>3. You can resubmit the Returned application after you are done with making the required changes. Please ensure to keep saving the application as draft while you progress.</p></p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We understand that this may require some additional effort on your part, and we sincerely appreciate your cooperation. Rest assured that we will treat your resubmitted application with the utmost attention and consideration during our evaluation process.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>If you have any questions or need further clarification regarding the resubmission process, please do not hesitate to reach out to our support executives at <Contact Details>. We are here to assist you and provide any necessary guidance.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'></p>Please note that the deadline for resubmitting your application is <deadline date>. Applications received after this date may not be considered for the current affiliation process.<p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'></p>We look forward to receiving your updated application.<p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>Thank you for your time and continued interest in getting affiliated from our organization.</p></td></tr></table></body></html>`,
        };

        // await sendEmailNotification(emailData);
    
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "The form has been returned to applicant!",
          toastType: "success",
        }));
       
      }
      //enketoFormSubmitButton.style.display = "none";
      //iframeContent.getElementById("submit-form").style.display = "none";
      
      navigation(ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home);
   
    } catch (error) {
      console.log(error)
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Failed to return form to applicant!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
   

  }

  const handleRejectOGA = async () => {
    const postData = {
      form_id: formSelected.form_id,
      remarks: "",
      date: new Date().toISOString().substring(0, 10),
    };
    try {
      setSpinner(true);
      const res = await getRejectApplicant(postData);
      const formStatus =
        res?.data?.update_form_submissions?.returning[0]?.form_status;
      let tempOGAFormsList = [...OGAFormsList];
      tempOGAFormsList.forEach((item) => {
        if (item.form_id === formSelected.form_id) {
          item.form_status = formStatus;
          item.noc_recommendation = "Not recommended";
        }
      });
      setOGAFormsList(tempOGAFormsList);
      registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: formSelected.form_id.toString(),
        entity_type: "form",
        event_name: "Rejected",
        remarks: `${userDetails?.firstName} ${userDetails?.lastName} has rejected the form!`,
      });

      updateFormStatus({
        form_id: formSelected.form_id * 1,
        form_status: "Rejected",
      });
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "The form is rejected!",
        toastType: "success",
      }));
      enabler++;
      setEnabler(enabler);
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "The form rejection failed!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleAcceptOGA = async () => {
    const postAccept1Data = {
      form_id: formSelected.form_id,
      remarks: "",
      date: new Date().toISOString().substring(0, 10),
      noc_Path: "",
      noc_fileName: "",
    };
    const postAccep2Data = {
      form_id: formSelected.form_id,
      remarks: "",
      date: new Date().toISOString().substring(0, 10),
      certificate_Path: "",
      certificate_fileName: "",
    };
    try {
      setSpinner(true);
      let response;
      if (round == 1) {
        response = await getAcceptApplicantNoc(postAccept1Data);
      }
      if (round == 2) {
        response = await getAcceptApplicantCertificate(postAccep2Data);
      }

      const formStatus =
        response?.data?.update_form_submissions?.returning[0]?.form_status;
      let tempOGAFormsList = [...OGAFormsList];
      tempOGAFormsList.forEach((item) => {
        if (item.form_id === formSelected.form_id) {
          item.form_status = formStatus;
          item.noc_recommendation = "Recommended";
        }
      });
      setOGAFormsList(tempOGAFormsList);
      registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: formSelected.form_id.toString(),
        entity_type: "form",
        event_name: "R2 form approved",
        remarks: `${userDetails?.firstName} ${userDetails?.lastName} has approved the form!`,
      });

      updateFormStatus({
        form_id: formSelected.form_id * 1,
        form_status: "Approved",
      });
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "The form is approved!",
        toastType: "success",
      }));
      enabler++;
      setEnabler(enabler);
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "The form approval failed!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleVerifyOGA = (action) => {
    if (!action) {
      handleRejectOGA();
    } else {
      handleAcceptOGA();
    }
  };

  const afterFormSubmit = async (e) => {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    try {
      if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
        isFormSubmittedForConfiirmation = true;
        setOnSubmit(true);
      }
    } catch (e) {
      console.log("error = ", e);
    }
  };

  const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
    if(typeof e.data === 'string' && e.data.includes('formLoad')) {
      setFormLoaded(true);
      return;
    }
    if (
      ENKETO_URL === e.origin + "/enketo" &&
      typeof e?.data === "string" &&
      JSON.parse(e?.data)?.state !== "ON_FORM_SUCCESS_COMPLETED" &&
      !isFormSubmittedForConfiirmation
    ) {
      var formData = new XMLParser().parseFromString(
        JSON.parse(e.data).formData
      );
      if (formData) {
        let images = JSON.parse(e.data).fileURLs;
        let prevData = await getFromLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`
        );

        await setToLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
          {
            formData: JSON.parse(e.data).formData,
            // imageUrls: { ...prevData?.imageUrls, ...images },
          }
        );
      }
    }
    afterFormSubmit(e);
  }

  const handleEventTrigger = async (e) => {
    handleFormEvents(startingForm, afterFormSubmit, e);
  };

  const bindEventListener = () => {
    window.addEventListener("message", handleEventTrigger);
  };

  const checkIframeLoaded = () => {
    if (!window.location.host.includes("localhost")) {
      const iframeElem = document.getElementById("enketo_OGA_preview");
      var iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;

      var section = iframeContent?.getElementsByClassName("or-group");
      if (!section) return;
      for (var i = 0; i < section?.length; i++) {
        var inputElements = section[i].querySelectorAll("input");
        var buttonElements = section[i].querySelectorAll("button");
        buttonElements.forEach((button) => {
          button.disabled = true;
        })
        inputElements.forEach((input) => {
          input.disabled = true;
          // enable admin remark fields
          if(input?.name.toLowerCase().includes('admin')) {
            input.disabled = false;
          }
        });
      }

      //iframeContent.getElementById("submit-form").style.display = "none";
      const submitFormbuttonElement = iframeContent.getElementById('submit-form');
      //setSubmitButton(submitFormbuttonElement)
      //enketoFormSubmitButton = submitFormbuttonElement;
      const spanElement = submitFormbuttonElement?.children[1];
      spanElement.textContent = 'Return to applicant';

      if(ogaRevertedCount > 2 || formStatus.toLowerCase() === "resubmitted"){
        submitFormbuttonElement.style.display = "none";
      }
      iframeContent.getElementById("save-draft").style.display = "none";
    }

    setSpinner(false);
  };

  // const checkIframeLoaded = () => {
  //   if (!window.location.host.includes("localhost")) {
  //     const iframeElem = document.getElementById("enketo_OGA_preview");
  //     var iframeContent =
  //       iframeElem?.contentDocument || iframeElem?.contentWindow.document;
  //     if (!iframeContent) return;

  //     var section = iframeContent?.getElementsByClassName("or-group");
  //     if (!section) return;
  //     for (var i = 0; i < section?.length; i++) {
  //       var inputElements = section[i].querySelectorAll("input");
  //       var buttonElements = section[i].querySelectorAll("button");
  //       buttonElements.forEach((button) => {
  //         button.disabled = true;
  //       })
  //       inputElements.forEach((input) => {
  //         input.disabled = true;
  //       });
  //     }

  //     //iframeContent.getElementById("submit-form").style.display = "none";
  //     const submitFormbuttonElement = iframeContent.getElementById('submit-form');
  //     //setSubmitButton(submitFormbuttonElement)
  //     //enketoFormSubmitButton = submitFormbuttonElement;
  //     const spanElement = submitFormbuttonElement?.children[1];
  //     spanElement.textContent = 'Return to applicant';

  //     if(ogaRevertedCount > 2 || formStatus.toLowerCase() === "returned"){
  //       submitFormbuttonElement.style.display = "none";
  //     }
  //     iframeContent.getElementById("save-draft").style.display = "none";
  //   }

  //   setSpinner(false);
  // };

  const getOGAFormsList = async () => {
    const postData = { applicant_form_id: formId, submitted_on: date };
    const res = await fetchOGAFormsList(postData);
    setOGAFormsList(res?.data?.form_submissions);
    setOgaLisCount(res?.data?.form_submissions.length);
    let count = 0;
    res?.data?.form_submissions.forEach((item) => {
      if (item.noc_recommendation) {
        count++;
      }
    });
    console.log("count", count);
    setEnabler(count);
  };
  useEffect(() => {
    getOGAFormsList();
    setSpinner(true);
    bindEventListener();

    // To clean all variables
    return () => {
      window.removeEventListener("message", handleEventTrigger);
    };
  }, []);

  useEffect(() => {
    if (formSelected) {
      setIframeFormURI(formSelected);
    } else {
      fetchFormData();
    }
  }, [formSelected]);

  useEffect(() => {
    if(formLoaded === true) {
      checkIframeLoaded();
    }
  }, [formLoaded]);

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

  return (
    <>
      {/* Breadcrum */}
      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}>
              <span className="text-primary-400">
                On Ground Inspection - All applications
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500 uppercase">
              {formDataFromApi?.course?.course_name.split("_").join(" ")}
            </span>
          </div>
        </div>
      </div>

      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-12">
          <div className="flex flex-row">
            <div className="flex grow justify-start items-center"></div>
            <div className="flex grow gap-4 justify-end items-center">
              {ogaLisCount === enabler && (
                <Fragment>
                  <button
                    onClick={() => setRejectModel(true)}
                    className={
                      formStatus == "Approved" ||
                      formStatus == "Rejected" ||
                      rejectStatus
                        ? "invisible cursor-not-allowed flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                        : "flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[180px] h-[40px] font-medium rounded-[4px]"
                    }
                  >
                    Reject Application
                    <span>
                      <AiOutlineClose />
                    </span>
                  </button>
                  <button
                    onClick={() => setOpenIssueNocModel(true)}
                    className={
                      formStatus == "Approved" ||
                      formStatus == "Rejected" ||
                      rejectStatus
                        ? "invisible cursor-not-allowed flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                        : "flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[180px] h-[40px] font-medium rounded-[4px]"
                    }
                  >
                    Approve Application
                    <span>
                      <AiOutlineCheck />
                    </span>
                  </button>
                </Fragment>
              )}

              <div
                className={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? "invisible"
                    : "inline-block h-[40px] min-h-[1em] w-0.5 border opacity-100 dark:opacity-50"
                }
              ></div>

              <button
                onClick={() => setOpenStatusModel(true)}
                className="border border-gray-500 text-blue-600 bg-gray-100 w-[140px] h-[40px] font-medium rounded-[4px]"
              >
                View status log
              </button>
            </div>
          </div>
          <div className="flex flex-row gap-4">
            <div className="flex w-[30%]">
              <OGASidebar
                OGAFormsList={OGAFormsList}
                setFormSelected={setFormSelected}
              />
            </div>
            <div className="flex w-full flex-col gap-4">
            {/*   {console.log("ogaRevertedCount_____",ogaRevertedCount)} */}
              <Card moreClass="flex flex-col gap-5 shadow-md">
                {formSelected && !formSelected?.noc_recommendation && (
                  <div className="flex grow gap-4 justify-end items-center">
                      {(ogaRevertedCount > 2) && (<Tooltip arrow content="This form has been resubmitted 3 times. No more reverts possible.">
                    &#9432;
                    </Tooltip>)}
                    <button
                      onClick={() => handleVerifyOGA(true)}
                      className="border border-gray-500 text-green-600 w-[140px] h-[40px] font-medium rounded-[4px]"
                    >
                      Approve OGA
                    </button>
                    <button
                      onClick={() => handleVerifyOGA(false)}
                      className="border border-gray-500 text-red-600 w-[140px] h-[40px] font-medium rounded-[4px]"
                    >
                      Reject OGA
                    </button>
                  </div>
                )}
                {/* add download logic here */}
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
                <iframe
                  id="enketo_OGA_preview"
                  title="form"
                  onLoad={checkIframeLoaded}
                  src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                    JSON.stringify(formSpec)
                  )}&xform=${encodedFormURI}&userId=${userId}`}
                  style={{ minHeight: "100vh", width: "100%" }}
                  ref={reportTemplateRef}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* {openModel && <NocModal closeModal={setOpenModel}  setOpenIssueNocModel={setOpenIssueNocModel} setToast={setToast} />} */}
      {rejectModel && (
        <RejectNocModal
          closeRejectModal={setRejectModel}
          setRejectStatus={setRejectStatus}
          formId={formId}
          instituteId={instituteId}
          instituteName={instituteName}
        />
      )}
      {/* {openCertificateModel && <IssueCertificateModal closeCertificateModal={setOpenCertificateModel}/>} */}
      {openStatusModel && (
        <StatusLogModal closeStatusModal={setOpenStatusModel} formId={formId} />
      )}
      {openIssueNocModel && (
        <IssueNocModal
          selectRound={round}
          // setRejectStatus={setRejectStatus}
          selectInstituteName={instituteName}
          formId={formId}
          setOpenIssueNocModel={setOpenIssueNocModel}
          instituteId={instituteId}
        />
      )}
       {onSubmit && (
        <CommonModal>
          <p className="text-secondary text-2xl text-semibold font-medium text-center">
            Are you sure, do you want to <span className="text-red-500">return</span>  this application with remarks to the applicant?
          </p>

          <div className="flex flex-row justify-center w-full py-4 gap-5">
            <div
              className="border border-primary bg-primary py-3 px-8 rounded-[4px] cursor-pointer items-center"
              onClick={() => {
                isFormSubmittedForConfiirmation = false;
                setOnSubmit(false);
              }}
            >
              No
            </div>
            <div
              className="bg-primary-900 py-3 rounded-[4px] px-8 text-white items-center gap-3 border border-primary py-3 px-7 cursor-pointer"
              onClick={() => handleFormReturnSubmit()}
            >
              Yes! Return
            </div>
          </div>
        </CommonModal>
      )}
    </>
  );
}
