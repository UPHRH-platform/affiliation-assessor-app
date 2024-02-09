import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDownload,
  faEye,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import CommonModal from "../Modal";
// import isOnline from "is-online";
import { logout } from "../../utils/index.js";
import { useEffect } from "react";
import { Tooltip } from "@material-tailwind/react";
import ButtonLoader from "../ButtonLoader";
import {
  base64ToPdf,
} from "../../api";

const CommonLayout = (props) => {
  const navigate = useNavigate();
  const [logoutModal, showLogoutModal] = useState(false);
  const [previewModal, showPreviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const onlineInterval = useRef();
  const [error, setError] = useState("");

  const handleFormDownload = async () => {
    try {
       setIsLoading(true);
      console.log("props.formUrl - ", props.formUrl);
        const res = await base64ToPdf(props.formUrl);
        const linkSource = `data:application/pdf;base64,${res.data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download =  `inspection_form_assessor_version_${new Date().toISOString().split('T')[0].split("-").reverse().join("-")}.pdf`;
        downloadLink.target = window.safari ? "" : "_blank";
        downloadLink.click();
      
   /*    // var strWindowFeatures = "fullscreen=1,channelmode=1,status=1,resizable=1";
      var win = window.open(props.formUrl, "_blank");

      // const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      console.log("win.document - ", win);
      setTimeout(() => {
        win.print();
        win.close();
      }, 2000); */

    } catch (error) {
      console.log(error);
      setError("Failed to download pdf version of the form.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onlineInterval.current = setInterval(async () => {
      let status = navigator.onLine;
      setOnline(status);
    }, 1000);
    return () => clearInterval(onlineInterval.current);
  }, []);

  return (
    <>
      <div className="flex flex-col bg-tertiary h-screen w-screen lg:w-[52vw] md:w-[80vw] md:m-auto lg:m-auto overflow-none">
        <div className="flex flex-row w-full justify-between relative">
          <div
            style={{
              height: 20,
              width: 20,
              borderRadius: "50%",
              position: "absolute",
              top: 0,
              right: 0,
              background: online ? "#229225" : "red",
              marginTop: 20,
              marginRight: 20,
            }}
          ></div>
          <img
            src="/assets/redGolLogo.png"
            className="p-5 h-[120px] w-[120px] lg:w-[170px] lg:h-[170px]"
            alt="illustration"
          />
          <img
            src="/assets/niramyaLogo.png"
            className="p-5 h-[120px] w-[120px] lg:w-[170px] lg:h-[170px]"
            alt="illustration"
          />
        </div>
        <div className="bg-white min-h-[calc(100vh-80px)] w-full rounded-t-[60px] overflow-none">
          <div className="flex flex-col px-8 py-7 gap-1">
            <div className="flex flex-row w-full items-center cursor-pointer gap-4">
              <div className="flex grow-0">
                {!props.backDisabled && (
                  <FontAwesomeIcon
                    icon={props.iconType === "close" ? faXmark : faArrowLeft}
                    className="text-2xl lg:text-4xl"
                    onClick={() => {
                      props.backFunction
                        ? props.backFunction()
                        : navigate(props.back);
                    }}
                  />
                )}
              </div>
              <div className="flex grow items-center flex-col gap-4">
                <div className="text-secondary tracking-wide text-[25px] font-bold lg:text-[36px] items-center">
                  {props.pageTitle}
                </div>
              </div>
              <div className="flex flex-row gap-3 grow-0">
                {!props.logoutDisabled && (
                  <Tooltip content="Logout">
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className="text-2xl lg:text-4xl"
                      onClick={() => showLogoutModal(true)}
                    />
                  </Tooltip>
                )}
                {props.formPreview && (
                  <Tooltip content="Preview Form">
                    <FontAwesomeIcon
                      icon={faEye}
                      className="text-xl lg:text-4xl"
                      onClick={() => {
                        props.setIsPreview(true);
                        showPreviewModal(true);
                      }}
                    />
                  </Tooltip>
                )}
                {props.downloadFile && !isLoading && (
                  <Tooltip content="Download Pdf">
                    <FontAwesomeIcon
                      icon={faDownload}
                      className="text-xl lg:text-4xl"
                      onClick={handleFormDownload}
                    />
                  </Tooltip>
                )}
                {props.downloadFile && isLoading && <ButtonLoader />}
              </div>
            </div>
            {props.pageDesc && (
              <div className="text-center text-gray-600">{props.pageDesc}</div>
            )}
          </div>
          {props.children}
        </div>
      </div>
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
            <div className="flex flex-grow">Preview</div>
            <div className="flex flex-grow justify-end">
              <FontAwesomeIcon
                icon={faXmark}
                className="text-2xl lg:text-4xl"
                onClick={() => {
                  props.setIsPreview(false);
                  showPreviewModal(false);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center w-full py-4">
            <div className="flex flex-col items-center">
              <iframe
                title="form"
                src={props.formUrl}
                style={{ height: "80vh", width: "100%" }}
              />
            </div>
          </div>
        </CommonModal>
      )}
      {logoutModal && (
        <CommonModal>
          <div>
            <p className="text-secondary text-xl lg:text-3xl text-semibold font-medium text-center">
              Continue to logout?
            </p>
            <div className="flex flex-row justify-center w-full py-4">
              <div
                className="border border-primary text-primary py-1 px-7 mr-2 cursor-pointer lg:px-16 lg:py-3 lg:text-xl"
                onClick={() => logout()}
              >
                Yes
              </div>
              <div
                className="border border-primary bg-primary text-white py-1 px-7 cursor-pointer lg:px-16 lg:py-3 lg:text-xl"
                onClick={() => showLogoutModal(false)}
              >
                No
              </div>
            </div>
          </div>
        </CommonModal>
      )}
    </>
  );
};

export default CommonLayout;
