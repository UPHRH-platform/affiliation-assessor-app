import React from "react";
import { Card, Button } from "./index";
import { readableDate } from "../utils/common";
import {  Tooltip } from "@material-tailwind/react";

const FormCard = (props) => {
  let name = props?.form?.course_name;
  name = name.charAt(0).toUpperCase() + name.slice(1);


  const isFormSubmissionDateOver = () => {
    //if (new Date("2023-11-11") < new Date()) {
    if (new Date(props?.form?.form?.last_submission_date) < new Date()) {
      return true;
    } else {
      return false
    }
  }


  return (
    <Card moreClass="flex flex-col border-gray-100 m-3 gap-3 w-[300px] border-[1px] drop-shadow justify-between">
      <div className="text-xl font-medium">{name}</div>
      <div
        className="text-sm truncate ... cursor-pointer"
        title={props?.form?.course_desc}
      >
        {props?.form?.course_desc}

      </div>
      <div className="flex" >
      <span className={"text-purple-400 text-sm  rounded-md p-1" } style={{ backgroundColor: "#eee" }}>
          Course type: {props?.form?.course_type}   -  ({props?.form?.course_level})
        </span>
        
     {/*    <span className={"text-indigo-700 text-sm rounded-md m-2"} style={{ backgroundColor: "#eee" }}>
          Course level: ({props?.form?.course_level})
        </span> */}
        </div>
        <div className="flex" >
        <span className={"text-teal-400 text-sm rounded-md p-1"} style={{ backgroundColor: "#eee" }}>
          Round : {props?.form?.round}
        </span>
           
      </div>
      <div className="flex" >
      <span
              className={`text-xs py-1 px-2  rounded-md text-yellow-800}`}
              style={{ backgroundColor: "#eee" }}
            >
              {console.log(props?.form)}
            Last Date for Submission: <span>{readableDate(props?.form?.form?.last_submission_date)}</span>
            </span> 
      </div>
      <div className="flex">
        <Button
          moreClass="text-primary-500 font-bold uppercase border-gray-500 text-primary-400"
          style={{ backgroundColor: "#fff" }}
          text="Apply"
          onClick={props.onApply ? () => props.onApply(props?.form) : null}
          otherProps={{
            disabled : isFormSubmissionDateOver()
          }}
        ></Button>
         {  isFormSubmissionDateOver() && 
            <div className="flex grow gap-4 justify-end items-center">
         <Tooltip arrow content="Last date to apply is over. Please contact admin">
                    &#9432;
                    </Tooltip>
                    </div>}
      </div>
    </Card>
  );
};

export default FormCard;
