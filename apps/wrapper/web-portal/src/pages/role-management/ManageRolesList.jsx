import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { MdFileUpload, MdEdit, MdDelete, MdSwapHoriz } from "react-icons/md";

import { Button } from "../../components";
import FilteringTable from "../../components/table/FilteringTable";

import { readableDate, removeCookie, setCookie } from "../../utils/common";
import {
  filterUsers,
  getAllAssessors,
  searchUsers,
  handleActiveUser,
  handleInctiveUser,
  handleDeleteUser,
  getAllRegulators,
  sendEmailNotification,
  fetchAllUserRoles,
  handleActiveRegulatorUser,
  updateRoleById
} from "../../api";

import { userService } from "../../api/userService";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";

//import DeleteUsersModal from "./DeleteUsers";
import Nav from "../../components/Nav";
//import BulkUploadUsersModal from "./BulkUploadUsersModal";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { ContextAPI } from "../../utils/ContextAPI";
//import ViewScheduleModal from "./ViewScheduleModal";
import data from "../../assets/json-files/messages.json";

export default function ManageRolesList({
  
}) {
  const navigation = useNavigate();
  let resUserData = [];
  const [deleteBulkUsersModel, setDeleteBulkUsersModel] = useState(false);

  // const[onRowSelected,setOnRowSelected] = useState([])
  const [deleteFlag, setDeleteFlag] = useState(false);
  const [bulkDeleteFlag, setBulkDeleteFlag] = useState(false);
  const [listArray, setListArray] = useState();

  const [roleStatus, setRoleStatus] = useState(false);
  const [userTableList, setUserTableList] = useState([]);

  const [invalidUserRowFlag] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([{ userId: "" }]);


  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);
  let selectedRows = [];

  const COLUMNS = [
    {
      Header: "Role name",
      accessor: "full_name",
    },
    {
      Header: "Module",
      accessor: "module",
    },
    {
      Header: "Pages",
      accessor: "pages",
    },
    {
      Header: "Role Status",
      accessor: "status",
    },
    {
      Header: "",
      accessor: "more_actions",
    },
    {
      Header: "",
      accessor: "isRowInvalid",
      Cell: () => {
        return invalidUserRowFlag;
      },
    },
  ];


  const handleRoleStatusUpdate = async (role) => {

    try {
      setSpinner(true);

      const reqBody = {
        id: role?.id,
        param: {
          active: role.active ? false : true
        }
      }
      console.log(reqBody.param.active)
      const response = await updateRoleById(reqBody)
      console.log(response.data.update_role.returning[0].active)
      //let roleStatus1 = response.data.update_role.returning[0].active
      setRoleStatus(roleStatus => !roleStatus)
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: response.data.update_role.returning[0].active ? "Role activated successfully" : "Role deactivated successfully" ,
        toastType: `success`,
      }));



    } catch (error) {
      const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage;
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: errorMessage,
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };


  const sendActivationStatusNotification = async (userDetails, status) => {
    // let mailBody = require('./json-files/mail-body.json');
    if (userDetails.email) {
      const emailBody = status === 'active' ? data.ACTIVATION_MAIL : data.INACTIVATION_MAIL;
        const emailData = {
          recipientEmail: [`${userDetails.email}`],
          emailSubject: `${emailBody.SUBJECT}`,
          emailBody: `${emailBody.BODY.part1}${userDetails.name}${emailBody.BODY.part2}`
        };
        // sendEmailNotification(emailData)
     
    }
  }


  const setTableData = (e) => {
    //console.log(e)
    let pagesArr = []
    e.permissions?.action[0].pages.forEach(element => {
     // console.log(element)
      pagesArr.push(`<p>${element}</p>`)

    });
   
    let usersData = {
      full_name: e.fname || e.lname ? e.fname + " " + e.lname : e.name,
      // pages: pagesArr.length ? `${pagesArr} , ` : "-",
      pages: `${e.permissions?.action[0].pages} , ` || "ALL",
      module: e.permissions?.module?.length ? `${e.permissions?.module}` : "-",
      status:
        e.active
          ? "Active"
          : !e.active
            ? "Inactive"
            : "-",
      id: e.id,
      more_actions: (
        <div className="flex flex-row text-2xl font-semibold">
          <Menu placement="bottom-end">
            <MenuHandler>
              <button className="leading-3 relative top-[-8px]">...</button>
            </MenuHandler>
            <MenuList className="p-2">
              <MenuItem
                onClick={() =>
                  navigation(
                    `${ADMIN_ROUTE_MAP.adminModule.roleManagement.updateRole}/${e.id}`
                  )
                }
              >
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdEdit />
                  </div>
                  <div className="text-semibold">
                    <span>Edit</span>
                  </div>
                </div>{" "}
              </MenuItem>
              <MenuItem
                onClick={() => handleRoleStatusUpdate(e)
                }
              >
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdSwapHoriz />
                  </div>
                  <div className="text-semibold">
                    <span>
                      {e?.active
                        ? "Deactivate"
                        : "Activate"}
                    </span>
                  </div>
                </div>{" "}
              </MenuItem>

            </MenuList>
          </Menu>
        </div>
      ),
    };
    resUserData.push(usersData);
  };


  const getAllUserRoles = async () => {
    //resUserData=[];
    const reqBody = {
      object: {
      },
      offsetNo: 0,
      limit: 10
    }

    try {
      setSpinner(true);
      const res = await fetchAllUserRoles(reqBody);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.role_aggregate.aggregate.count,
      }));
     
      res?.data?.role.forEach(setTableData);
      //console.log(resUserData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      resUserData=[];
      setSpinner(false);
    }
  };

  const searchApiCall = async (searchData) => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchUsers(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessors_aggregate.aggregate.totalCount,
      }));
      // setUsersList(res?.data?.assessors);
      res?.data?.assessors.forEach(setTableData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const filterApiCall = async (filters) => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...filters,
    };
    try {
      setSpinner(true);
      const res = await filterUsers(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res?.data?.assessors_aggregate?.aggregate?.totalCount,
      }));
      // setUsersList(res?.data?.assessors);
      const data = res?.data?.assessors;
      data.forEach(setTableData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const handleDelete = async (userId) => {
    const postData = {
      request: {
        userName: userId,
      },
    };
    const hasuraPostData = { user_id: userId };
    try {
      setSpinner(true);
      let accessTokenObj = {
        grant_type: "client_credentials",
        client_id: "admin-api",
        client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
      };
      const accessTokenResponse = await userService.getAccessToken(
        accessTokenObj
      );
      setCookie(
        "access_token",
        "Bearer " + accessTokenResponse.data.access_token
      );
      let hasuraResponse = {};
      const response = await userService.deleteUsers(postData);
      if (response.status === 200) {
        hasuraResponse = await handleDeleteUser(hasuraPostData);
      }
    
    
      setDeleteFlag(false);
      setSelectedUserId([]);

      if (hasuraResponse.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "User Deleted!",
          toastType: "success",
        }));
      }

      removeCookie("access_token");
    } catch (error) {
      const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: errorMessage,
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const setSelectedRows = (rowList) => {
    let checkboxArr = [];
    rowList.forEach((item) => {
      let checkboxObj = {};
      checkboxObj.email = item.values.email;
      checkboxObj.status = item.values.status;
      checkboxObj.user_id = item.original.id;
      checkboxArr.push(checkboxObj);
    });
    selectedRows = checkboxArr;
    setListArray(selectedRows.length);
  };

  const handleBulkDelete = async (bulkEmail) => {
    const postData = bulkEmail;
    try {
      setSpinner(true);
      let errorFlag = false;
      let accessTokenObj = {
        grant_type: "client_credentials",
        client_id: "admin-api",
        client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
      };
      // const accessTokenResponse = await userService.getAccessToken(
      //   accessTokenObj
      // );
      // if (accessTokenResponse.status !== 200) {
      //   errorFlag = true;
      // }
      // setCookie(
      //   "access_token",
      //   "Bearer " + accessTokenResponse.data.access_token
      // );
      setCookie("access_token", process.env.REACT_APP_AUTH_TOKEN);

      // const res = await userService.deleteUsers(postData);

      postData.forEach(async (item) => {
        {
          const res = await userService.deleteUsers({
            request: {
              userName: item?.user_id,
            },
          });
          if (res.status !== 200) {
            errorFlag = true;
          }
        }
      });

      if (!errorFlag) {
        bulkEmail.map(async (item) => {
          let bulkHasuraPostData = { user_id: item.user_id };
          const hasuraResponse = await handleDeleteUser(bulkHasuraPostData);
          if (hasuraResponse.status !== 200) {
            errorFlag = true;
          }
        });
      }

      // fetchAllAssessors();
      setBulkDeleteFlag(false);
      setDeleteBulkUsersModel(false);
      selectedRows = [];
      if (!errorFlag) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Users Deleted!",
          toastType: "success",
        }));
      }

      removeCookie("access_token");
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while deleting!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };
  const handleUserStatus = async (selectedRows) => {
    for (let x in selectedRows) {
      if (selectedRows[x].status.toLowerCase() === "active") {
        const postData = { assessorId: selectedRows[x].user_id };
        const validResponse = await handleInctiveUser(postData);


      } else if (selectedRows[x].status.toLowerCase() === "inactive") {
        const postData = { assessorId: selectedRows[x].user_id };
        const validResponse = await handleActiveUser(postData);

      }
    }
    // await fetchAllAssessors();

  };

  useEffect(() => {
   
    getAllUserRoles();
   //setUserTableList(resUserData);
  }, [roleStatus]);

  useEffect(() => {
    if (bulkDeleteFlag) {
      // handleDelete(selectedUserId);
      handleBulkDelete(selectedRows);
    }
  }, [bulkDeleteFlag]);

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      getAllUserRoles();
    }
  }, [paginationInfo.offsetNo, paginationInfo.limit]);



  return (
    <>
      <Nav />

      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col justify-center align-center">
          <div className="flex flex-col justify-center align-center gap-4">
            <div className="flex flex-row">
              <div className="flex grow items-center">
                <h1 className="text-xl font-semibold">Manage User Roles</h1>
              </div>
              <div className="flex justify-end">
                <span className="flex gap-4">
                  {/*  {state.menu_selected === "Assessor" && (
                    <Button
                      otherProps={{
                        disabled: listArray == 0 ? true : false,
                      }}
                      moreClass={`${
                        listArray == 0
                          ? "cursor-not-allowed border border-gray-500 bg-white text-gray-200 px-8 h-[44px]"
                          : "px-8 text-white"
                      }`}
                      onClick={() => {
                        if (selectedRows.length > 0) {
                          handleUserStatus(selectedRows);
                        }
                      }}
                      text="Activate / Inactivate Role"
                    ></Button>
                  )} */}
                  {/*  {<Button
                    // moreClass="text-white"
                    otherProps={{
                      disabled: listArray == 0 ? true : false,
                    }}
                    moreClass={`${
                      listArray == 0
                        ? "cursor-not-allowed border border-gray-500 bg-white w-fit text-gray-200 px-8 h-fit"
                        : "px-8 text-white"
                    }`}
                    onClick={() =>
                      selectedRows.length
                        ? setDeleteBulkUsersModel(true)
                        : setDeleteBulkUsersModel(false)
                    }
                    text="Delete Role"
                  ></Button>} */}
                  {/* <button
                    onClick={() => setBulkUploadUsersModel(true)}
                    className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-900 bg-white w-[200px] h-[45px] text-md font-medium rounded-[4px]"
                  >
                    Bulk upload users
                    <span className="text-xl">
                      <MdFileUpload />
                    </span>
                  </button> */}
                  <Button
                    moreClass="text-white"
                    text="Add Role"
                    onClick={() =>
                      navigation(
                        `${ADMIN_ROUTE_MAP.adminModule.roleManagement.updateRole}`
                      )
                    }
                  ></Button>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {/* <ul className="flex flex-wrap gap-3 -mb-px">
                <li onClick={() => handleSelectMenu("Assessor")}>
                  <a
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Assessor"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                  >
                    Assessor
                  </a>
                </li>

              

              </ul> */}
              {/* filtering table here */}
             
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={COLUMNS}
                    navigateFunc={() => { }}
                    showCheckbox={false}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => { }}
                    setSelectedRows={setSelectedRows}
                    showFilter={false}
                    showSearch={false}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/*  {deleteUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setDeleteFlag}
          closeDeleteUsersModal={setDeleteUsersModel}
        />
      )} */}

      {/*  {deleteBulkUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setBulkDeleteFlag}
          closeDeleteUsersModal={setDeleteBulkUsersModel}
        />
      )} */}

      {/*  {bulkUploadUsersModel && (
        <BulkUploadUsersModal
          closeBulkUploadUsersModal={setBulkUploadUsersModel}
          setUsersCreated={setUsersCreated}
        />
      )} */}

      {/*   {viewScheduleModal && (
        <ViewScheduleModal
          closeViewSchedulesModal={setViewScheduleModal}
          scheduleUserData={scheduleUserData}
        ></ViewScheduleModal>
      )} */}
    </>
  );
}
