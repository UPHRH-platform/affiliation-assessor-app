import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Select, Option } from "@material-tailwind/react";

import FilteringTable from "../../components/table/FilteringTable";
import Card from "../../components/Card";
import Nav from "../../components/Nav";

import { getFieldName, readableDate } from "../../utils/common";
import {
  filterOGA,
  getOnGroundAssessorData,
  markReviewStatus,
  searchOGA,
} from "../../api";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { ContextAPI } from "../../utils/ContextAPI";

export default function OnGroundInspectionAnalysis() {
  const navigation = useNavigate();
  var resData = {};
  var formsDataList = [];
  resData = formsDataList;
  const [formsList, setFormsList] = useState();
  const [round, setRound] = useState(1);
  const [state, setState] = useState({
    menu_selected: "OGA Completed",
  });
  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner } = useContext(ContextAPI);

  const COLUMN_OGA_COMPLETED = [
    {
      Header: "Form name",
      accessor: "display_form_name",
    },
    {
      Header: "Institute",
      accessor: "applicant",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Course type",
      accessor: "course_type",
    },
    {
      Header: "Assessor",
      accessor: "assessor",
    },
    {
      Header: "Submitted on",
      accessor: "submitted_on",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ];
  const COLUMN_APPROVED = [
    {
      Header: "Form name",
      accessor: "display_form_name",
    },
    {
      Header: "Institute",
      accessor: "applicant",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Course type",
      accessor: "course_type",
    },
    {
      Header: "Assessor",
      accessor: "assessor",
    },
    {
      Header: "Approved on",
      accessor: "reviewed_on",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ];
  const COLUMN_REJECTED = [
    {
      Header: "Form name",
      accessor: "display_form_name",
    },
    {
      Header: "Institute",
      accessor: "applicant",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Course type",
      accessor: "course_type",
    },
    {
      Header: "Assessor",
      accessor: "assessor",
    },
    {
      Header: "Rejected on",
      accessor: "reviewed_on",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ];

  const cardArray = [
    {
      value: 0,
      key: "total",
      text: "Total",
    },
    {
      value: 0,
      key: "submitted_today",
      text: "Received today",
    },
    {
      value: 0,
      key: "in_progress",
      text: "In progress",
    },
    {
      value: 0,
      key: "reviewed",
      text: "Reviewed",
    },
    {
      value: 0,
      key: "pending",
      text: "Total pending",
    },
  ];

  const handleSelectMenu = (menuItem) => {
    setState((prevState) => ({ ...prevState, menu_selected: menuItem }));
    setPaginationInfo((prevState) => ({ ...prevState, offsetNo: 0 }));
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  const navigateToView = (formObj) => {
    const navigationURL = `${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.viewForm}/${formObj?.original?.form_name}/${formObj?.original?.id}/${formObj?.original?.institute?.name}/${round}/${formObj?.original?.date}`;
    navigation(navigationURL);
    // const postData = { form_id: formObj?.original?.id };
    // markStatus(postData);
  };

  const markStatus = async (postData) => {
    try {
      setSpinner(true);
      const res = await markReviewStatus(postData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      fetchOnGroundAssessorData();
    }
  }, [
    paginationInfo.offsetNo,
    paginationInfo.limit,
    state.menu_selected,
    round,
  ]);

  const fetchOnGroundAssessorData = async () => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      formStatus: state.menu_selected,
      round: round,
    };
    try {
      setSpinner(true);
      const res = await getOnGroundAssessorData(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res?.data?.form_submissions_aggregate.aggregate.totalCount,
      }));
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
      formStatus: state.menu_selected,
      round: round,
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchOGA(postData);
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

  const filterApiCall = async (filters) => {
    const customFilters = {
      condition: {
        ...filters["condition"],
        form_status: { _eq: state.menu_selected },
        round: { _eq: round },
      },
    };
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...customFilters,
    };
    try {
      setSpinner(true);
      const res = await filterOGA(postData);
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

  const status_obj = {
    total: formsList?.length,
    submitted_today: 0,
    in_progress: 0,
    reviewed: 0,
    pending: 0,
  };

  formsList?.forEach((e) => {
    var formsData = {
      display_form_name: e?.course?.course_name,
      applicant:
        e?.institute?.name?.charAt(0).toUpperCase() +
        e?.institute?.name?.substring(1).toLowerCase() +
        ", " +
        e?.institute?.district?.charAt(0).toUpperCase() +
        e?.institute?.district?.substring(1).toLowerCase(),
      form_name: e?.form_name,
      application_type: e?.course?.application_type?.split("_")?.join(" "),
      course_type: `${e?.course?.course_type} - ${e?.course?.course_level}`,
      assessor:
        e?.assessment_schedule_applicant_form?.[0]?.assessor.name || "NA",
      published_on: e?.assessment_schedule_applicant_form?.[0]?.date
        ? readableDate(e?.assessment_schedule_applicant_form?.[0]?.date)
        : "NA",
      submitted_on: e?.submitted_on? readableDate(e?.submitted_on) : "NA",
      reviewed_on: readableDate(e?.reviewed_on) || "NA",
      id: e.form_id,
      status: e?.form_status || "NA",
      form_status: e?.form_status,
      institute: e?.institute,
      date: e?.assessment_schedule_applicant_form?.[0]?.date,
    };

    resData.push(formsData);
  });

  cardArray.forEach((obj) => {
    obj.value = status_obj[obj.key];
  });

  return (
    <>
      <Nav />
      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-8">
          {/* <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-medium">Your activity</h1>
            </div>
            <div className="flex flex-wrap">
              {cardArray.map((obj, index) => (
                <Card
                  moreClass="shadow-md w-[200px] h-[100px] m-3 first:ml-0"
                  key={index}
                >
                  <div className="flex flex-col place-items-start justify-center gap-2">
                    <h3 className="text-xl font-semibold">{obj.value}</h3>
                    <div className="text-sm font-medium text-gray-700">
                      {obj.text}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div> */}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">All Applications</h1>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <div className="w-72 bg-white rounded-[8px]">
                  <Select
                    value={round}
                    label="Select round"
                    onChange={(value) => {
                      setRound(value);
                      setPaginationInfo((prevState) => ({
                        ...prevState,
                        offsetNo: 0,
                      }));
                      setIsSearchOpen(false);
                      setIsFilterOpen(false);
                    }}
                  >
                    <Option value={1}>Round one</Option>
                    <Option value={2}>Round two</Option>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ul className="flex flex-wrap -mb-px">
              {/* <li
                className="gap-3"
                onClick={() => handleSelectMenu("Inspection Scheduled")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Inspection Scheduled"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  New
                </a>
              </li> */}
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("OGA Completed")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "OGA Completed"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                  aria-current="page"
                >
                  OGA Completed
                </a>
              </li>
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("Approved")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Approved"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                  aria-current="page"
                >
                  Approved
                </a>
              </li>
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("Rejected")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Rejected"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  Rejected
                </a>
              </li>
            </ul>
            {/* <div>create a search bar and filter component here</div> */}
            {/* table creation starts here */}
            {state.menu_selected === "OGA Completed" && (
              <div className="flex flex-col gap-4">
                <FilteringTable
                  dataList={resData.filter(
                    (item) => item.form_status === "OGA Completed"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN_OGA_COMPLETED}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  showSearch={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}
            {state.menu_selected === "Approved" && (
              <div className="flex flex-col gap-4">
                <FilteringTable
                  dataList={resData.filter(
                    (item) => item.form_status === "Approved"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN_APPROVED}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  showSearch={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}
            {state.menu_selected === "Rejected" && (
              <div className="flex flex-col gap-4">
                <FilteringTable
                  dataList={resData.filter(
                    (item) => item.form_status === "Rejected"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN_REJECTED}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  showSearch={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
