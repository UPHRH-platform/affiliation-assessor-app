import React, { useContext, useState } from "react";
import {
  getAcceptApplicant,
  getAcceptApplicantCertificate,
  nocPdfUploader,
  getAcceptApplicantNoc,
  registerEvent,
  updateFormStatus,
  getApplicantDeviceId,
  sendPushNotification,
  sendEmailNotification,
  getAllRegulatorDeviceId,
} from "../../api";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { getCookie } from "../../utils";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components";
import { ContextAPI } from "../../utils/ContextAPI";
import { getLocalTimeInISOFormat } from "../../utils";

function IssueNocModal({
  setOpenIssueNocModel,
  selectRound,
  formId,
  selectInstituteName,
  setRejectStatus,
  instituteId,
}) {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState({});
  const [comment, setComment] = useState("");
  const [fileTypeError, setFileTypeError] = useState(false);
  let pathName = "";
  let nocorCertificateFileName = "";
  const { setSpinner, setToast } = useContext(ContextAPI);
  const userDetails = getCookie("userData");
  //const user_details = userDetails?.userRepresentation;
  const hiddenFileInput = React.useRef(null);
  let selectedRound = "";
  if (selectRound === "1") {
    selectedRound = "noc";
  } else {
    selectedRound = "certificate";
  }

  const handleFile = (uploadFile) => {
    const formData = {
      file: uploadFile,
      type: selectedRound,
      prefix: selectInstituteName,
    };

    getNocOrCertificatePdf(formData);
  };

  const handleChangeComments = (e) => {
    setComment(e.target.value);
  };

  const handleChange = (e) => {
    const fileUploaded = e.target.files[0];
    if (!fileUploaded.name.includes(".pdf") || fileUploaded.size > 5000000) {
      setFileTypeError(true);
    } else {
      setFileName(
        fileUploaded.name.substring(0, fileUploaded.name.lastIndexOf("."))
      );
      setFileTypeError(false);

      setFile(fileUploaded);
    }
  };

  const handleClick = (e) => {
    hiddenFileInput.current.click();
  };

  const getNocOrCertificatePdf = async (postData) => {
    try {
      setSpinner(true);
      const res = await nocPdfUploader(postData);
      pathName = res?.data?.fileUrl;
      nocorCertificateFileName = res?.data?.fileName;

      postData?.type?.toLowerCase() === "noc"
        ? handleAcceptApplicantRoundOne()
        : handleAcceptApplicantRoundTwo();

      if (res.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "File uploaded successfully!",
          toastType: "success",
        }));
        navigate(
          `${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.nocIssued}/${selectRound}`
        );
      }
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while uploading!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleAcceptApplicantRoundOne = async () => {
    const postData = {
      form_id: formId,
      remarks: comment,
      date: new Date().toISOString().substring(0, 10),
      noc_Path: pathName,
      noc_fileName: nocorCertificateFileName,
    };
    try {
      setSpinner(true);
      const responseNoc = await getAcceptApplicantNoc(postData);
      registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: formId.toString(),
        entity_type: "form",
        event_name: "Approved",
        remarks: `${userDetails?.firstName} ${userDetails?.lastName} has approved the form  has approved the form with the following remarks ${comment}.`,
      });

      updateFormStatus({
        form_id: formId * 1,
        form_status: "Approved",
      });

      const applicantRes = await getApplicantDeviceId({
        institute_id: instituteId,
      });
      if (getCookie("firebase_client_token") !== undefined) {
        //applicant push notification
        if (applicantRes?.data) {
          let tempIds = JSON.parse(
            applicantRes?.data?.institutes[0]?.institute_pocs[0]?.device_id
          );
          let tempIdsFilter = tempIds.filter(function (el) {
            return el != null;
          });
          if (tempIdsFilter.length) {
            sendPushNotification({
              title: `NOC Approval`,
              body: `We are pleased to inform you that your application has received the necessary No Objection Certificate (NOC) approval. Your application is proceeding to the next stage of the review process`,
              deviceToken: tempIdsFilter,
              userId:
                applicantRes?.data?.institutes[0]?.institute_pocs[0]?.user_id,
            });
          }
        }
        //regulator push notification
        const regAPIRes = await getAllRegulatorDeviceId();
        let regDeviceIds = [];
        regAPIRes?.data?.regulator?.forEach((item) => {
          let tempIds = JSON.parse(item.device_id);
          let tempIdsFilter = tempIds.filter(function (el) {
            return el != null;
          });
          if (tempIdsFilter.length) {
            regDeviceIds.push({
              user_id: item.user_id,
              device_id: tempIdsFilter[0],
            });
          }
        });

        console.log("regulator device ids-", regDeviceIds);
        if (regDeviceIds.length) {
          regDeviceIds.forEach((regulator) =>
            sendPushNotification({
              title: "NOC Approval",
              body: `NOC granted for ${applicantRes?.data?.institutes[0]?.name}`,
              deviceToken: [regulator.device_id],
              userId: regulator.user_id,
            })
          );
        }
      }

      //email notify
      if (applicantRes?.data?.institutes[0]?.email) {
        const emailData = {
          recipientEmail: [`${applicantRes?.data?.institutes[0]?.email}`],
          emailSubject: `NOC granted for ${applicantRes?.data?.institutes[0]?.name}`,
          emailBody: `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Your Email Title</title><link href='https://fonts.googleapis.com/css2?family=Mulish:wght@400;600&display=swap' rel='stylesheet'></head><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 20px; text-align: center; background-color: #F5F5F5;'><img src='https://regulator.upsmfac.org/images/upsmf.png' alt='Logo' style='max-width: 360px;'></td></tr></table><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 36px;'><p style='color: #555555; font-size: 18px; font-family: 'Mulish', Arial, sans-serif;'>Dear ${applicantRes?.data?.institutes[0]?.name},</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We hope this email finds you well. After careful consideration and evaluation, we are delighted to inform you that UTTAR PRADESH SCRUTINTY COMMITTE has granted NOC for affiliation to ${applicantRes?.data?.institutes[0]?.name}.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>Forms for round 2 have been enabled for you to fill and submit. Please submit the round 2 application within one year from the issue of this NOC.</p><p style='color: #555555; font-weight: bold; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>Note: To download NOC open the form which you have submitted and click on the DOWNLOAD NOC/CERTIFICATE</p></td></tr></table></body></html>`,
        };

        // sendEmailNotification(emailData);
      }

      pathName = "";
      nocorCertificateFileName = "";
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  const handleAcceptApplicantRoundTwo = async () => {
    const postData = {
      form_id: formId,
      remarks: comment,
      date: new Date().toISOString().substring(0, 10),
      certificate_Path: pathName,
      certificate_fileName: nocorCertificateFileName,
    };
    try {
      setSpinner(true);
      const responseCertificate = await getAcceptApplicantCertificate(postData);
      const formStatus =
        responseCertificate?.data?.update_form_submissions?.returning[0]
          ?.form_status;
      // setRejectStatus(formStatus === "Approved" ? true : false);
      registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: formId,
        entity_type: "form",
        event_name: "R2 form approved",
        remarks: `${userDetails?.firstName} ${userDetails?.lastName} has approved the form with the following remarks ${comment}.`,
      });

      updateFormStatus({
        form_id: formId * 1,
        form_status: "Approved",
      });

      const applicantRes = await getApplicantDeviceId({
        institute_id: instituteId,
      });

      if (getCookie("firebase_client_token") !== undefined) {
        //applicant push notification
        if (applicantRes?.data) {
          let tempIds = JSON.parse(
            applicantRes?.data?.institutes[0]?.institute_pocs[0]?.device_id
          );
          let tempIdsFilter = tempIds.filter(function (el) {
            return el != null;
          });
          if (tempIdsFilter.length) {
            sendPushNotification({
              title: `Affiliation Certificate Issued`,
              body: `Congratulations!

              We are delighted to inform you that an affiliation certificate has been issued to ${applicantRes?.data?.institutes[0]?.name}. Welcome to our esteemed institution!`,
              deviceToken: tempIdsFilter,
              userId:
                applicantRes?.data?.institutes[0]?.institute_pocs[0]?.user_id,
            });
          }
        }
        //regulator push notification
        const regAPIRes = await getAllRegulatorDeviceId();
        let regDeviceIds = [];
        regAPIRes?.data?.regulator?.forEach((item) => {
          let tempIds = JSON.parse(item.device_id);
          let tempIdsFilter = tempIds.filter(function (el) {
            return el != null;
          });
          if (tempIdsFilter.length) {
            regDeviceIds.push({
              user_id: item.user_id,
              device_id: tempIdsFilter[0],
            });
          }
        });

        console.log("regulator device ids-", regDeviceIds);
        if (regDeviceIds.length) {
          regDeviceIds.forEach((regulator) =>
            sendPushNotification({
              title: "Affiliation Certificate Issued",
              body: `Affiliation certificate granted to ${applicantRes?.data?.institutes[0]?.name}`,
              deviceToken: [regulator.device_id],
              userId: regulator.user_id,
            })
          );
        }
      }

      //email notify
      if (applicantRes?.data?.institutes[0]?.email) {
        const emailData = {
          recipientEmail: [`${applicantRes?.data?.institutes[0]?.email}`],
          emailSubject: `Affiliation certificate granted to ${applicantRes?.data?.institutes[0]?.name}`,
          emailBody: `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Your Email Title</title><link href='https://fonts.googleapis.com/css2?family=Mulish:wght@400;600&display=swap' rel='stylesheet'></head><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 20px; text-align: center; background-color: #F5F5F5;'><img src='https://regulator.upsmfac.org/images/upsmf.png' alt='Logo' style='max-width: 360px;'></td></tr></table><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 36px;'><p style='color: #555555; font-size: 18px; font-family: 'Mulish', Arial, sans-serif;'>Dear ${applicantRes?.data?.institutes[0]?.name},</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We hope this email finds you well. After careful consideration and evaluation, we are delighted to inform you that UPSMF has granted affiliation to ${selectInstituteName}. We believe that this partnership will bring significant benefits to both our institutions and contribute to the advancement of healthcare in our state.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>Congratulations on becoming an affiliated institute with UPSMF.</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>Note: To download certificate open the form which you have submitted and click on the DOWNLOAD NOC/CERTIFICATE</p></td></tr></table></body></html>`,
        };

        // sendEmailNotification(emailData);
      }



      pathName = "";
      nocorCertificateFileName = "";
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center fixed inset-0 bg-opacity-25 backdrop-blur-sm">
        <div className="flex justify-center p-4 rounded-xl shadow-xl border border-gray-400 bg-gray-100 w-[580px] h-fit">
          <div className="flex flex-col gap-4">
            <div className="title text-base flex font-bold">
              <h1>
                {" "}
                {selectRound === "1" ? "Upload NOC" : "Upload Certificate"}
              </h1>
            </div>

            <hr />
            <div className="body w-[496px] flex flex-col  flex justify-center items-center">
              <input
                type="file"
                accept="application/pdf, .pdf"
                ref={hiddenFileInput}
                onChange={handleChange}
                style={{ display: "none" }}
              />
              <div className="text-yellow-900 text-sm mb-2">
                Upload pdf file of size {"<"} 5mb
              </div>
              <Button
                moreClass="text-white flex justify-center h-fit w-1/2 px-6"
                text="Browse file to upload(.pdf)"
                onClick={handleClick}
              />{" "}
              {fileTypeError && (
                <div className="text-red-500">
                  {"Only pdf files accepted!(max size 5MB)"}
                </div>
              )}
               <div className="mt-4 flex justify-end ml-4">{fileName}</div>
              <textarea
                onChange={handleChangeComments}
                placeholder="Remarks"
                className="border w-[480px] h-[120px] p-2 mt-[8px] rounded-xl resize-none"
                name=""
                id=""
                cols="30"
                rows="10"
              ></textarea>
            </div>
            <div className="footer flex flex-row justify-between">
              <button
                onClick={() => {
                  setOpenIssueNocModel(false);
                }}
                className="border border-blue-900 bg-white text-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFile(file)}
                disabled={fileName && !fileTypeError ? false : true}
                // className="border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                className={`${
                  fileName && !fileTypeError
                    ? "border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                    : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 px-8 h-[44px]"
                }`}
              >
                {selectRound == 1 ? "Issue NOC" : "Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default IssueNocModal;
