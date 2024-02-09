import React, { useEffect, useState } from "react";
import {
  AiFillCheckCircle,
  AiFillCloseCircle,
  AiOutlineCheck,
  AiOutlineRollback
} from "react-icons/ai";

export default function OGASidebar(props) {
  let [selectedValue, setSelectedValue] = useState("Applicant Form");
  const postFormSelected = (formObj) => {
    props.setFormSelected(formObj);
    if (formObj) {
      setSelectedValue(formObj?.form_id);
    } else {
      setSelectedValue("Applicant Form");
    }
  };

  useEffect(() => {}, [props.OGAFormsList]);

  return (
    <div className="flex flex-col h-screen w-full">
      <ul className="flex flex-col text-sm font-medium">
        <li
          className={`p-3 border-4 border-[#F3F4F6] cursor-pointer hover:bg-gray-200 hover:border-l-blue-700 hover:border-y-gray-200 hover:border-r-gray-200 text-xl font-semibold ${
            selectedValue === "Applicant Form"
              ? "bg-gray-200 border-l-blue-700 border-y-gray-200 border-r-gray-200"
              : ""
          }`}
          onClick={() => postFormSelected()}
        >
          <span>Applicant Form</span>
        </li>
        {props.OGAFormsList.map((forms, idx) => {
          return (
            <li
              key={idx}
              className={`flex flex-row p-3 border-4 border-[#F3F4F6] cursor-pointer hover:bg-gray-200 hover:border-l-blue-700 hover:border-y-gray-200 hover:border-r-gray-200 ${
                selectedValue === forms.form_id
                  ? "bg-gray-200 border-l-blue-700 border-y-gray-200 border-r-gray-200"
                  : ""
              }`}
              onClick={() => postFormSelected(forms)}
            >
              <div className="flex flex-grow">
                {forms?.course?.course_name || "NA"}
              </div>
              <div className="flex items-center">
              {forms?.noc_recommendation === null &&
                forms?.form_status?.toLowerCase() === "returned" && (
                  <AiOutlineRollback className="text-[20px] text-orange-500" />
                )}
                {forms?.noc_recommendation === null &&
                forms?.form_status?.toLowerCase() != "returned" && (
                 <AiOutlineCheck />)}
                {forms?.noc_recommendation?.toLowerCase() === "recommended" && (
                  <AiFillCheckCircle className="text-[20px] text-green-500" />
                )}
                {forms?.noc_recommendation?.toLowerCase() ===
                  "not recommended" && (
                  <AiFillCloseCircle className="text-[20px] text-red-500" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
