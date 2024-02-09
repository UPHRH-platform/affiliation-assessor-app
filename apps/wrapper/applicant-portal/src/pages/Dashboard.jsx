import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import { getCookie } from "../utils";
import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";

const Dashboard = () => {
  const navigate = useNavigate();
  // useEffect(()=>{
  //   let userDetails = getCookie("userData")
  //   if(userDetails?.userRepresentation?.username){
  //     navigate(APPLICANT_ROUTE_MAP.dashboardModule.my_applications)
  //   }
  // },[])
  return (
    <div className="flex flex-col">
      <Header />
      {/* <div className='min-h-[calc(100vh-148px)] px-3 py-12'> */}
      <Outlet />
      {/* </div> */}
    </div>
  );
};

export default Dashboard;
