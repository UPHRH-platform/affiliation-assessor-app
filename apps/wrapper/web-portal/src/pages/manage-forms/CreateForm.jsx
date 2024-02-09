import React, { useContext, useEffect, useState ,useRef} from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../components/Button";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar.css";

import { FaAngleRight } from "react-icons/fa";
import UploadForm from "./UploadForm";
import {
  convertODKtoXML,
  createForm,
  updateForms,
  viewForm,
  findFormsWithSameName,
  getCoursesByTypeAndLevel,
} from "../../api";
import { Label } from "../../components";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { ContextAPI } from "../../utils/ContextAPI";
import { setCookie, getCookie, removeCookie } from "../../utils/common";
import { formatDate, readableDate } from "../../utils/common";

const CreateForm = () => {
  const [formStatus, setFormStatus] = useState("");
  const navigate = useNavigate();
  const { formId } = useParams();
  const [formStage, setFormStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [xmlData, setXmlData] = useState(null);
  const [courseMapping, setCourseMapping] = useState(null);
  let requestData = { courseType: '', courseLevel: '' };
  const [formData, setFormData] = useState({
    title: "",
    assignee :"",
    course_type :"" ,
    course_mapping :"",
    labels :"",
    course_level :"",
    round_no:"",
    application_type :"",
    form_desc :"" ,
    last_submission_date :""
  });
  const [sameFileNameerror, setSameFileNameerror] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);
  let assigneePrefix = "";
  assigneePrefix = formData?.assignee;

  const [showCalendar, setShowCalendar] = useState(false);
  const [buttonText, setButtonText] = useState("Last Date For Submission");
  
  const [lastDateToApply, setLastDateToApply] = useState(null);
  const calendarRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };


  const handleCalendarOnChangeDate = (date) => {
    setButtonText(formatDate(date));
    setShowCalendar(false);
    setLastDateToApply(date);
    setFormData((prevState) => ({
      ...prevState,
      last_submission_date: formatDate(date),
    }));
  };

  const handleCourseTypeChange = (e) => {
    formData.course_mapping="";
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    requestData.courseType = e.target.value;
    requestData.courseLevel = formData.course_level;
    if ((requestData.courseType !== undefined && requestData.courseLevel !== undefined) && (requestData.courseLevel !== "" && requestData.courseType !== "")) {
      getCourses(requestData);
    }
  }

  const handleCourseLevelChange = (e) => {
    formData.course_mapping="";
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    requestData.courseType = formData.course_type;
    requestData.courseLevel = e.target.value;
    if ((requestData.courseType !== undefined && requestData.courseLevel !== undefined) && (requestData.courseLevel !== "" && requestData.courseType !== "")) {
      getCourses(requestData);
    }
  }

  const getCourses = async (postData) => {
    try {
      const response = await getCoursesByTypeAndLevel(postData);
      formData.course_mapping="";
      if(response?.data){
        setCourseMapping(response?.data?.course_mapping);
      }
     
    } catch (error) {
      console.log(error)
    }
   
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!formId){
      findForms();
    } else {
      setFormStage(2);
    //  isFieldsValid();
    }
   
  };

  const isFieldsValid = () => {
    //console.log("----------")
    if (
      formData.title ===  "" ||
      formData.assignee === "" || 
      formData.course_type ===  ""  || 
      formData.course_mapping ===  ""  || 
      formData.labels ===  ""  || 
      formData.course_level ===  ""  || 
      formData.round_no ===  "" || 
      formData.application_type ===  ""  || 
      formData.form_desc ===  "" || 
      formData.last_submission_date ===  "" 
    ) {
      return true;
    } else return false;
  };

  const findForms = async () => {
    try {
      setSpinner(true);
      const reqBody = {
        "param": {
          "title": {
            "_eq": formData.title.trim()
          },
          "assignee": {
            "_eq": formData.assignee.toLowerCase().trim()
          }
        }
      }
      const res = await findFormsWithSameName(reqBody);
      if (res.data.forms_aggregate.aggregate.totalCount != 0) {
        setFormData((prevState) => ({
          ...prevState,
          title: ""
        }));
        setSameFileNameerror(true)
      } else {
        setSameFileNameerror(false)
        setFormStage(2);
      }
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Something went wrong. Please try again later",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  }

  const handleFile = (file) => {
    const formData = {
      file: file,
      prefix: assigneePrefix,
    };
    uploadOdkForm(formData);
  };
  const handleSaveUpdateDraft = async (action) => {
    let postData = new FormData();
    Object.keys(formData).forEach((key) => postData.append(key, formData[key]));

    const user = getCookie("regulator");
    postData.append("user_id", user?.[0]?.user_id);
    postData.append("form_status", "Draft");
   // postData.append("last_submission_date", formatDate(lastDateToApply));
    try {
      setSpinner(true);
      setLoading(true);
      if (action === "save") {
        const formResponse = await createForm(postData);
      }
      if (action === "update") {
        postData.append("form_id", formId);
        const formResponse = await updateForms(postData);
      }
      navigate(ADMIN_ROUTE_MAP.adminModule.manageForms.home);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form successfully saved as draft!",
        toastType: "success",
      }));
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while saving form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const uploadOdkForm = async (postData) => {
    try {
      setSpinner(true);
      const res = await convertODKtoXML(postData);
      setXmlData(res.data);
      setFormData((prevState) => ({
        ...prevState,
        path: res.data.fileUrl,
        file_name: res.data.fileName,
      }));

      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "File successfully converted to XML format!",
        toastType: "success",
      }));
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

  const getFormDetails = async (formData) => {
    try {
      setSpinner(true);
      const response = await viewForm(formData);
      const formDetail = response.data.forms[0];
      setFormStatus(formDetail?.form_status);
      if (formDetail) {
        const req = {
          courseType: formDetail?.course_type,
          courseLevel: formDetail?.course_level,
        }
        getCourses(req);
        setFormData({
          application_type: formDetail?.application_type,
          form_desc: formDetail.form_desc,
          assignee: formDetail?.assignee,
          course_type: formDetail?.course_type,
          course_level: formDetail?.course_level,
          course_mapping: formDetail?.course_mapping,
          labels: formDetail?.labels,
          round_no: formDetail?.round,
          title: formDetail?.title,
          path: formDetail?.path,
          file_name: formDetail?.file_name,
          last_submission_date: formDetail?.last_submission_date
        });
        setLastDateToApply(new Date(formDetail?.last_submission_date))
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

  const handleOutsideDateClick = (e) => {
    if (calendarRef.current && !calendarRef.current.contains(e.target)) {
      setShowCalendar(false)
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideDateClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideDateClick);
    };
  });

  useEffect(() => {
   console.log(lastDateToApply)
   lastDateToApply ?  setButtonText(formatDate(lastDateToApply))
   : setButtonText("Last Date For Submission")
  }, [lastDateToApply]);


  useEffect(() => {
    if (window.location.pathname.includes("view")) {
      let form_id = window.location.pathname.split("/")[4];
      let formData = new FormData();
      formData.append("form_id", form_id);
      getFormDetails(formData);
    }
  }, []);

  return (
    <>
      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.manageForms.home}>
              <span className="text-primary-400 cursor-pointer">
                Manage Forms
              </span>
            </Link>
            <FaAngleRight className="text-gray-500 text-[16px]" />
            <Link to={ADMIN_ROUTE_MAP.adminModule.scheduleManagement.home}>
              <span className="text-gray-500">Create form</span>
            </Link>

          </div>
        </div>
      </div>
      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="container mx-auto px-3 min-h-[40vh]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-bold">Create form</h1>
              <div className="flex gap-4">
                <Button
                  moreClass="px-6 text-primary-600 bg-white border border-primary-600"
                  style={{ backgroundColor: "" }}
                  text="Cancel"
                  onClick={() =>
                    navigate(ADMIN_ROUTE_MAP.adminModule.manageForms.home)
                  }
                />
                <Button
                  moreClass={`${Object.values(formData).length !== 12
                      ? "text-gray-500 bg-white border border-gray-300 cursor-not-allowed"
                      : "text-white border"
                    } px-6`}
                  text="Update"
                  onClick={() => handleSaveUpdateDraft("update")}
                  otherProps={{
                    disabled: Object.values(formData).length !== 12,
                    style: { display: formStatus !== "Draft" ? "none" : "" },
                  }}
                />
                  {console.log(formData)}
                <Button
                  moreClass={`${Object.values(formData).length !== 12
                      ? "text-gray-500 bg-white border border-gray-300 cursor-not-allowed"
                      : "text-white border"
                    } px-6`}
                  text="Save as draft"
                  onClick={() => handleSaveUpdateDraft("save")}
                
                  otherProps={{
                    disabled: Object.values(formData).length !== 12,
                    hidden: formStage <= 1,
                    style: {
                      display:
                        formStatus === "Published" ||
                          formStatus === "Unpublished" ||
                          formStatus === "Draft"
                          ? "none"
                          : "",
                    },
                  }}
                />
              </div>
            </div>

            <div className="flex flex-row gap-4 justify-center">
              <div
                className={`${formStage === 1
                    ? "bg-black text-white"
                    : "bg-white text-black"
                  } py-3 px-10 rounded-[4px] text-[16px]`}
              >
                1. Add attributes
              </div>
              <div
                className={`${formStage === 2
                    ? "bg-black text-white"
                    : "bg-white text-black"
                  } py-3 px-10 rounded-[4px] text-[16px]`}
              >
                2. Upload ODK
              </div>
            </div>

            {formStage === 1 && (
              <form>
                <div className="flex flex-col bg-white rounded-[4px] p-8 gap-8">
                  <div className="flex">
                    <h1 className="text-xl font-semibold">Add attributes</h1>
                  </div>
                  <div className="flex flex-grow">
                    <div className="grid grid-rows-3 grid-cols-6 gap-8">
                    <div className="sm:col-span-3">
                        <Label
                          required
                          text="Form title"
                          moreClass="block text-sm font-medium leading-6 text-gray-900"
                        />
                        <div className="mt-2">
                          <input
                            required
                            value={formData.title}
                            type="text"
                            placeholder="Type here"
                            id="title"
                            name="title"
                            onChange={handleChange}
                            disabled={
                              formStatus == "Published" ||
                              formStatus == "Unpublished"
                            }
                            className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                          {sameFileNameerror && (
                            <div className="text-red-500 mt-2 text-sm">
                              ODK with this name already exists
                            </div>
                          )}
                        </div>
                      </div>
                      <div 

                      className="sm:col-span-3"   ref={calendarRef}>
                        <Label
                          required
                          text="Last Date for Submission"
                          htmlFor="last_date"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                            <button type="button"
                              className="h-[45px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 px-8"
                              onClick={() => setShowCalendar(true)}
                              disabled={
                                formStatus == "Published" ||
                                formStatus == "Unpublished"
                              }
                            >
                              {buttonText.includes("Last Date For Submission") ? buttonText : readableDate(buttonText)}
                            </button>
                            {showCalendar && (
                              <Calendar minDate={new Date()}
                               value={lastDateToApply} 
                               onChange={handleCalendarOnChangeDate} />
                            )}
                          
                      </div>
                   
                      <div className="sm:col-span-6">
                        <Label
                          required
                          text="Form description"
                          moreClass=" block text-sm font-medium leading-6 text-gray-900"
                        />
                        <div className="">
                          <textarea
                            required
                            value={formData.form_desc}
                            type="text"
                            placeholder="Type here"
                            id="form_desc"
                            name="form_desc"
                            onChange={handleChange}
                            disabled={
                              formStatus == "Published" ||
                              formStatus == "Unpublished"
                            }
                            className="resize-none block w-full rounded-md border-0 p-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3 ">
                        <Label
                          required={true}
                          text="Application type"
                          htmlFor="application_type"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.application_type}
                          name="application_type"
                          id="application_type"
                          onChange={handleChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value="new_institute">New Institute</option>
                          <option value="new_course">New Course</option>
                          <option value="seat_enhancement">
                            Seat Enhancement
                          </option>
                        </select>
                      </div>
                      <div className="sm:col-span-3 ">
                        <Label
                          required
                          text="Round No."
                          htmlFor="round_no"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.round_no}
                          name="round_no"
                          id="round_no"
                          onChange={handleChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value={1}>Round 1</option>
                          <option value={2}>Round 2</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <Label
                          required
                          text="Course type"
                          htmlFor="course_type"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.course_type}
                          name="course_type"
                          id="course_type"
                          onChange={handleCourseTypeChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value="Nursing">Nursing</option>
                          <option value="Paramedical">Paramedical</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <Label
                          required
                          text="Course level"
                          htmlFor="course_level"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.course_level}
                          name="course_level"
                          id="course_level"
                          onChange={handleCourseLevelChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value="Degree">Degree</option>
                          <option value="Diploma">Diploma</option>
                        </select>
                      </div>
                      {courseMapping !== null && (
                        <div className="sm:col-span-3">
                          <Label
                            required
                            text="Course Name"
                            htmlFor="course_mapping"
                            moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                          />
                          <select
                            required
                            value={formData.course_mapping}
                            name="course_mapping"
                            id="course_mapping"
                            onChange={handleChange}
                            disabled={
                              formStatus == "Published" ||
                              formStatus == "Unpublished"
                            }
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="">Select Here</option>
                            {courseMapping.map((obj, index) => (
                              <>
                                <option key={index} value={obj.course}>{obj.course}</option>
                              </>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="sm:col-span-3">
                        <Label
                          required
                          text="Form labels"
                          htmlFor="labels"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.labels}
                          name="labels"
                          id="labels"
                          onChange={handleChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value="infrastructure">Infrastructure</option>
                          <option value="teaching_learning_process">
                            Teaching Learning Process
                          </option>
                          <option value="objective_structured_clinical_examination">
                            Objective Structured Clinical Examination
                          </option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <Label
                          required
                          text="Assignee"
                          htmlFor="assignee"
                          moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                        />

                        <select
                          required
                          value={formData.assignee}
                          name="assignee"
                          id="assignee"
                          onChange={handleChange}
                          disabled={
                            formStatus == "Published" ||
                            formStatus == "Unpublished"
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Select here</option>
                          <option value="applicant">Applicant</option>
                          <option value="admin">Admin</option>
                          <option value="on-ground_assessor">
                            On-ground Assessor
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                       moreClass="border text-white w-[120px]"
                       text="Next"
                    /*   disabled={
                        Object.values(formData).length < 10 ? true : false
                      } */
                      otherProps={{
                        disabled : isFieldsValid(),
                      }}
                      onClick={handleSubmit}
                    >
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {formStage === 2 && (
              <UploadForm
                setFormStage={setFormStage}
                formStatus={formStatus}
                handleFile={handleFile}
                xmlData={xmlData}
                formData={formData}
                setFormData={setFormData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateForm;
