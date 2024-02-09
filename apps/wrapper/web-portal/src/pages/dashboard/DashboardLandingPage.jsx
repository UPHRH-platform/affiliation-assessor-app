import React, { useContext, useEffect, useState } from "react";

import Header from "../../components/Header";
import Nav from "../../components/Nav";
import FilteringTable from "../../components/table/FilteringTable";
import { ContextAPI } from "../../utils/ContextAPI";
import { Option, Select } from "@material-tailwind/react";
import { Button } from "../../components";
import {
  filterDashBoardData,
  searchDashBoard,
  getInProgressCount,
  getApprovedCount,
  getRejectedCount,
  exportToExcel
} from "../../api";

import {
  readableDate,
} from "../../utils/common";

const DashboardLandingPage = (props) => {

  const { setSpinner } = useContext(ContextAPI);
  const [formsList, setFormsList] = useState();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [round, setRound] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });

  const [pageFilters, setPageFilters] = useState({
    "round": {
      "_eq": 1
    }
  });
  const [inProgressCount, setInProgressCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const formsDataList = [];


  const COLUMNS = [
    {
      Header: "Application ID",
      accessor: "application_id",
    },
    {
      Header: "Date",
      accessor: "date",
    },
    {
      Header: "Institute Name",
      accessor: "institute_name",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Course Type",
      accessor: "course_type",
    },
    {
      Header: "Form title",
      accessor: "form_name",
    },
    {
      Header: "City",
      accessor: "city",
    },
    {
      Header: "Status",
      accessor: "status",
    }

  ];

  useEffect(() => {
    filterApiCall();
  }, [
    paginationInfo.offsetNo,
    paginationInfo.limit,
    round
  ]);

  useEffect(() => {
    fetchInProgressCount();
  }, [
    round
  ]);

  
  useEffect(() => {
    setTotalCount(inProgressCount + approvedCount + rejectedCount)
  }, [
    inProgressCount,approvedCount,rejectedCount
  ]);


  const fetchInProgressCount = async () => {
    const postData = {
      round: round
    };
    try {
      const res = await getInProgressCount(postData);
      setInProgressCount(res?.data?.form_submissions_aggregate.aggregate.count)
    } catch (error) {
      console.log("error - ", error);
    } finally {
     
      fetchApprovedCount();
      setSpinner(false);
    }
  };
  const fetchApprovedCount = async () => {
    console.log(round)
    const postData = {
      round: round
    };
    try {
      const res = await getApprovedCount(postData);
       console.log(res?.data?.form_submissions_aggregate.aggregate.count)
      setApprovedCount(res?.data?.form_submissions_aggregate.aggregate.count)
    } catch (error) {
      console.log("error - ", error);
    } finally {
      fetchRejectedCount();
      setSpinner(false);
     
    }
  };
  const fetchRejectedCount = async () => {
    const postData = {
      round: round
    };
    try {
      const res = await getRejectedCount(postData);
      setRejectedCount(res?.data?.form_submissions_aggregate.aggregate.count);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
   
    }
  };


  const filterApiCall = (filters) => {

    let payload = {
      "round": {
        "_eq": round
      }
    };

    if (filters !== 'cleared') {
      payload = {
        ...pageFilters,
        "round": {
          "_eq": round
        }
      };
    }

    if (filters?.status) {
      payload.form_status = { "_eq": filters.status }
    }

    if (filters?.district) {
      payload.institute = {
        "district": {
          "_eq": filters.district
        }
      }
    }

    if (filters?.startDate && filters?.endDate) {
      payload.submitted_on = {
        "_gte": filters.startDate,
        "_lte": filters.endDate
      }
    }
    setPageFilters(payload);
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      param: payload,
    };

    filterDashBoard(postData);
  }

  const filterDashBoard = async (postData) => {

    try {
      setSpinner(true);
      const res = await filterDashBoardData(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.form_submissions_aggregate.aggregate.totalCount,
      }));
//      setTotalCount(res.data.form_submissions_aggregate.aggregate.totalCount)
      setFormsList(res?.data?.form_submissions);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const searchApiCall = async (searchData) => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...searchData
    };
    try {
      setSpinner(true);
      const res = await searchDashBoard(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.form_submissions_aggregate.aggregate.totalCount,
      }));
      setFormsList(res?.data?.form_submissions);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const downloadReport = async () => {
    if (paginationInfo.totalCount > 0) {

      const payload = {
        ...pageFilters,
        "round": {
          "_eq": round
        }
      };
     
      const postData = {
        offsetNo: 0,
        limit: paginationInfo.totalCount,
        param: payload
      };
      try {
        setSpinner(true);
        const res = await filterDashBoardData(postData);
        // setFormsList(res?.data?.form_submissions);
        console.log('form details: ', res?.data?.form_submissions);
        const dashBoardReports = {
          sheetName: 'report',
          downloadObject: [],
          headers: ['Application ID', 'Date', 'Institute Name', 'Application Type', 'Course Type', 'Form Title', 'City', 'Status']
        }
        res?.data?.form_submissions.forEach((element) => {
          const report = {
            application_id: element.form_id,
            date: readableDate(element?.submitted_on) || "-",
            institute_name: element?.institute.name || "-",
            application_type: element?.course_type || "-",
            course_type: element?.course_level || "-",
            form_name: element?.form_name,
            city: element?.institute.district || "-",
            status: element?.form_status || "-",
          }
          dashBoardReports.downloadObject.push(report)
        })
        const roundName = round === 1 ? 'Round One' : 'Round Two'
        const downloadObjects = {
          fileName: `${roundName} dashboard_reports.xlsx`,
          objectsList: [dashBoardReports]
        }
        exportToExcel(downloadObjects);
        
      } catch (error) {
        console.log("error - ", error);
      } finally {
        setSpinner(false);
      }
    }
  }

  formsList?.forEach((e) => {
    const formsData = {
      application_id: e.form_id,
      date: readableDate(e?.submitted_on) || "-",
      application_type: e?.course_type || "-",
      course_type: e?.course_level || "-",
      // course_name: `${e?.course?.course_type} - ${e?.course?.course_level}` || "NA",
      institute_name: e?.institute.name || "-",
      id: e.form_id,
      form_name: e?.form_name,
      status: e?.form_status || "-",
      city: e?.institute.district || "-"
    };
    formsDataList.push(formsData);
  });

  const handleChange = async (round) => {
    console.log(round)
    // setRound(round).then;
    setRound(round)
    //fetchDashBoardData(round);
    //filterApiCall();
  }

  return (
    <>
      <Header />

      <Nav />
    
      <div
        className={`container ; m-auto min-h-[calc(100vh-148px)] px-3 py-12`}
      >
        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-4">

            <div className="flex justify-end">
              <div>
                <span>
                <span className="   mr-5">
                <label>
                    Total Applications: <span className="w-72   mr-5"  > <b>{totalCount}</b> </span>
                  </label>
                </span>
                  <span className="mr-5" style={{ backgroundColor: "yellow"}}>
                  <label>
                    In-Progress Applications: <span className="w-72   mr-5"  ><b> {inProgressCount}</b></span>
                  </label>
                  </span>
                  <span className="mr-5" style={{ backgroundColor: "green" }}>
                  <label>
                    Approved Applications:<span className="w-72   mr-5" > <b>{approvedCount}</b> </span>  
                  </label>
                  </span>
                  <span style={{ backgroundColor: "red" }}>
                  <label>
                    Rejected Applications:<span className="w-72   mr-5"> <b>{rejectedCount}</b>  </span>
                  </label>
                  </span>
                </span>
              </div>
            </div>

          

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
               
                <div className="w-72 bg-white rounded-[8px]">
                  <Select
                    value={round}
                    label="Select round"
                    onChange={(value) => {
                      handleChange(value);
                      /*   setPaginationInfo((prevState) => ({
                          ...prevState,
                          offsetNo: 0,
                        })); */
                      setIsFilterOpen(false);
                      setIsSearchOpen(false);
                    }}
                  >
                    <Option value={1}>Round one</Option>
                    <Option value={2}>Round two</Option>
                  </Select>
                 
                </div>
               
              </div>
              <div className="sm:col-span-3 flex justify-end">
              <Button
                onClick={() => {
                  downloadReport();
                }}
                moreClass="border boevent_namerder-blue-500 bg-white text-blue-500 w-[160px]"
                text="Download Report"
              ></Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">

            {/* table creation starts here */}
            <div className="flex flex-col gap-4">

              <FilteringTable
                dataList={formsDataList}
                // navigateFunc={navigateToView}
                navigateFunc={() => { }}
                columns={COLUMNS}
                pagination={true}
                onRowSelect={() => { }}
                filterApiCall={filterApiCall}
                showFilter={true}
                selectedRound={round}
                showSearch={true}
                paginationInfo={paginationInfo}
                setPaginationInfo={setPaginationInfo}
                searchApiCall={searchApiCall}
                setIsSearchOpen={setIsSearchOpen}
                setIsFilterOpen={setIsFilterOpen}
              />
            </div>
          </div>
        </div>

      </div>

    </>
  );
};

export default DashboardLandingPage;


