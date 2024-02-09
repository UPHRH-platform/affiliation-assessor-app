import React, { useContext, useState } from "react";
import {
  getAllRegulatorDeviceId,
  getApplicantDeviceId,
  getRejectApplicant,
  registerEvent,
  sendEmailNotification,
  sendPushNotification,
  updateFormStatus,
} from "../../api";
import { ContextAPI } from "../../utils/ContextAPI";
import { getCookie, getLocalTimeInISOFormat } from "../../utils";

import { Button } from "../../components";
import { useNavigate } from "react-router-dom";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";

function ReturnToInstituteModal({
  closeRejectModal,
  setRejectStatus,
  formId,
  instituteId,
  instituteName,
}) {
  const userDetails = getCookie("userData");
  const navigate = useNavigate();


  const handleChange = (e) => {
    setComment(e.target.value);
  };

  const [comment, setComment] = useState("");
  const { setSpinner, setToast } = useContext(ContextAPI);

  const handleRejectApplicant = async () => {
    if (comment.length === 0) {
      // console.log("enter something");
    } else {
      const postData = {
        form_id: formId,
        remarks: comment,
        date: new Date().toISOString().substring(0, 10),
      };
      try {
        setSpinner(true);
        const res = await getRejectApplicant(postData);
        console.log("remarks", res);
        const rejectedRemarks =
          res?.data?.update_form_submissions?.returning[0]?.remarks;
        const formStatus =
          res?.data?.update_form_submissions?.returning[0]?.form_status;
        setRejectStatus(formStatus === "Rejected" ? true : false);
        registerEvent({
          created_date: getLocalTimeInISOFormat(),
          entity_id: formId.toString(),
          entity_type: "form",
          event_name: "Rejected",
          remarks: `${userDetails?.firstName} ${userDetails?.lastName} has rejected the form with the following remarks ${rejectedRemarks}.`,
        });

        updateFormStatus({
          form_id: formId * 1,
          form_status: "Rejected",
        });
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "The form is rejected!",
          toastType: "success",
        }));
        closeRejectModal(false);

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
                title: "Application Termination",
                body: `We regret to inform you that your application has been terminated. We appreciate your interest and encourage you to consider applying in the future.`,
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
                title: "Application Termination",
                body: `Please be informed that the ${instituteName}'s application form has been terminated. Kindly update the records accordingly.`,
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
            emailSubject: `Application terminated!`,
            emailBody: `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Your Email Title</title><link href='https://fonts.googleapis.com/css2?family=Mulish:wght@400;600&display=swap' rel='stylesheet'></head><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 20px; text-align: center; background-color: #F5F5F5;'><img src='https://regulator.upsmfac.org/images/upsmf.png' alt='Logo' style='max-width: 360px;'></td></tr></table><table width='100%' bgcolor='#ffffff' cellpadding='0' cellspacing='0' border='0'><tr><td style='padding: 36px;'><p style='color: #555555; font-size: 18px; font-family: 'Mulish', Arial, sans-serif;'>Dear ${applicantRes?.data?.institutes[0]?.name},</p><p style='color: #555555; font-size: 18px; line-height: 1.6; font-family: 'Mulish', Arial, sans-serif;'>We hope this email finds you well. We are writing to kindly request the resubmission of your application for the affiliation process. We apologize for any inconvenience caused, but it appears that there was an issue with the initial submission. Following is the reason for rejection ${rejectedRemarks}</p></td></tr></table></body></html>`,
          };

          // sendEmailNotification(emailData);
        }
        setTimeout(
          () => navigate(`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}`),
          1500
        );
      } catch (error) {
        console.log(error);
      } finally {
        setSpinner(false);
      }
    }
  };

  return (
    <>
      <div className="flex justify-center items-center fixed inset-0 bg-opacity-25 backdrop-blur-sm">
        <div className="flex justify-center p-4 rounded-xl shadow-xl border border-gray-400 bg-gray-100 w-[580px] h-[300px]">
          <div className="flex flex-col gap-4">
            <div className="title flex font-bold">
              <h1>Reason for rejecting this application</h1>
            </div>
            <div className="body">
              <textarea
                onChange={handleChange}
                placeholder="Write here"
                className="border w-[520px] h-[160px] p-2 rounded-xl resize-none"
                name=""
                id=""
                cols="30"
                rows="10"
              ></textarea>
            </div>
            <div className="footer flex flex-row justify-between">
              <button
                onClick={() => {
                  closeRejectModal(false);
                }}
                className="border border-blue-500 bg-white text-blue-500 w-[140px] h-[40px] font-medium rounded-[4px]"
              >
                Close
              </button>
              <button
                onClick={handleRejectApplicant}
                className={`${
                  comment
                    ? "bg-blue-500 text-white"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                } border w-[140px] h-[40px] font-medium rounded-[4px] `}
                disabled={!comment ? true : false}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReturnToInstituteModal;
