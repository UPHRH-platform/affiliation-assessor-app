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
  fetchAllDeskTopAssessors,
  handleActiveRegulatorUser,
  handleInctiveRegulatorUser,
  fetchAllInstitutes
} from "../../api";

import { userService } from "../../api/userService";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";

import DeleteUsersModal from "./DeleteUsers";
import Nav from "../../components/Nav";
import BulkUploadUsersModal from "./BulkUploadUsersModal";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { ContextAPI } from "../../utils/ContextAPI";
import ViewScheduleModal from "./ViewScheduleModal";
import data from "../../assets/json-files/messages.json";

export default function ManageUsersList({
  closeDeleteUsersModal,
  closeBulkUploadUsersModal,
  closeViewSchedulesModal,
  setDeleteFlags,
}) {
  const navigation = useNavigate();
  let resUserData = [];
  const [deleteUsersModel, setDeleteUsersModel] = useState(false);
  const [deleteBulkUsersModel, setDeleteBulkUsersModel] = useState(false);

  // const[onRowSelected,setOnRowSelected] = useState([])
  const [deleteFlag, setDeleteFlag] = useState(false);
  const [bulkDeleteFlag, setBulkDeleteFlag] = useState(false);
  const [listArray, setListArray] = useState();

  const [bulkUploadUsersModel, setBulkUploadUsersModel] = useState(false);
  const [viewScheduleModal, setViewScheduleModal] = useState(false);
  const [scheduleUserData, setScheduleUserData] = useState({});
  const [usersList, setUsersList] = useState();
  const [userTableList, setUserTableList] = useState([]);

  const [invalidUserRowFlag] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([{ userId: "" }]);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState({
    menu_selected: "Assessor",
  });

  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);
  const [usersCreated, setUsersCreated] = useState(false);
  let selectedRows = [];

  const COLUMNS = [
    {
      Header: "Full name",
      accessor: "full_name",
    },
    {
      Header: "Code",
      accessor: "code",
    },
    {
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Mobile number",
      accessor: "mobile_number",
    },
    {
      Header: "Role",
      accessor: "role",
    },
    {
      Header: "Account Status",
      accessor: "status",
    },
    {
      Header: "",
      accessor: "schedule",
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

  const ADMIN_COLUMN = [
    {
      Header: "Full name",
      accessor: "full_name",
    },
    {
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Mobile number",
      accessor: "mobile_number",
    },
    {
      Header: "Role",
      accessor: "role",
    },
    {
      Header: "Account Status",
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

  const handleSelectMenu = (menuItem) => {
    setState((prevState) => ({ ...prevState, menu_selected: menuItem }));
    setPaginationInfo((prevState) => ({ ...prevState, offsetNo: 0 }));
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  const handleUsersetInvalid = async (user) => {
    const userId = user?.user_id;
    const formData = new FormData();
    if (state.menu_selected === 'Assessor') {
      formData.append("assessorId", userId);
    } else {
      formData.append("requlatorId", userId);
    }
    let e = user;
    try {
      setSpinner(true);

      const reqBody = {
        "request": {
          "userName": userId
        }
      }

      const res = await userService.deActivateUserKeycloak(reqBody)
      if(res){
        const response = state.menu_selected === 'Assessor' ? await handleInctiveUser(formData) : await handleInctiveRegulatorUser(formData);
        e["workingstatus"] = "Invalid";
        resUserData.forEach((item) => {
          if (item.id === userId) {
            item.status = "Inactive";
            item.more_actions = (
              <div className="flex flex-row text-2xl font-semibold">
                <Menu placement="bottom-end">
                  <MenuHandler>
                    <button className="leading-3 relative top-[-8px]">...</button>
                  </MenuHandler>
                  <MenuList className="p-2">
                    <MenuItem
                      onClick={() =>
                        navigation(
                          `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                        )
                      }
                    >
                      <div className="flex flex-row gap-4 mt-4">
                        <div>
                          <MdEdit />
                        </div>
                        <div className="text-semibold m-">
                          <span>Edit</span>
                        </div>
                      </div>{" "}
                    </MenuItem>
                    <MenuItem
                      onClick={() =>
                        e?.workingstatus === "Invalid"
                          ? handleUserSetValid(e)
                          : handleUsersetInvalid(e)
                      }
                    >
                      <div className="flex flex-row gap-4">
                        <div>
                          <MdSwapHoriz />
                        </div>
                        <div className="text-semibold m-">
                          <span>
                            {e?.workingstatus === "Invalid"
                              ? "Activate"
                              : "Deactivate"}
                          </span>
                        </div>
                      </div>
                    </MenuItem>
                 {/*    <MenuItem onClick={() => handleUserDelete(e)}>
                      <div className="flex flex-row gap-4">
                        <div>
                          <MdDelete />
                        </div>
                        <div className="text-semibold m-">
                          <span>Delete</span>
                        </div>
                      </div>{" "}
                    </MenuItem> */}
                  </MenuList>
                </Menu>
              </div>
            );
          }
        });
       // console.log("data", resUserData);
        setUserTableList(resUserData);
        const userDetails = response?.data?.update_assessors?.returning[0] ? response?.data?.update_assessors?.returning[0] : response?.data?.update_regulator?.returning[0]
        if (userDetails) {
          sendActivationStatusNotification(userDetails, 'inactive');
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "User deactivated successfully",
            toastType: "success",
          }));
        }
      }

     
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

  const handleViewSchedule = (data) => {
    setScheduleUserData(data);
    setViewScheduleModal(true);
  };

  const handleUserSetValid = async (user) => {
    const userId = user?.user_id;
    const formData = new FormData();
    if (state.menu_selected === 'Assessor') {
      formData.append("assessorId", userId);
    } else {
      formData.append("requlatorId", userId);
    }
    let e = user;
    try {
      setSpinner(true);

      const reqBody = {
        "request": {
          "userName": userId
        }
      }

      const res = await userService.activateUserKeycloak(reqBody)

      if (res.status === 200) {
        const validResponse = state.menu_selected === 'Assessor' ? await handleActiveUser(formData) : await handleActiveRegulatorUser(formData);
        e["workingstatus"] = "Valid";
        resUserData.forEach((item) => {
          if (item.id === userId) {
            item.status = "Active";
            item.more_actions = (
              <div className="flex flex-row text-2xl font-semibold">
                <Menu placement="bottom-end">
                  <MenuHandler>
                    <button className="leading-3 relative top-[-8px]">...</button>
                  </MenuHandler>
                  <MenuList className="p-2">
                    <MenuItem
                      onClick={() =>
                        navigation(
                          `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                        )
                      }
                    >
                      <div className="flex flex-row gap-4">
                        <div>
                          <MdEdit />
                        </div>
                        <div className="text-semibold m-">
                          <span>Edit</span>
                        </div>
                      </div>{" "}
                    </MenuItem>
                    <MenuItem
                      onClick={() =>
                        e?.workingstatus === "Invalid"
                          ? handleUserSetValid(e)
                          : handleUsersetInvalid(e)
                      }
                    >
                      <div className="flex flex-row gap-4">
                        <div>
                          <MdSwapHoriz />
                        </div>
                        <div className="text-semibold m-">
                          <span>
                            {e?.workingstatus === "Invalid"
                              ? "Activate"
                              : "Deactivate"}
                          </span>
                        </div>
                      </div>{" "}
                    </MenuItem>
                  {/*   <MenuItem onClick={() => handleUserDelete(e)}>
                      <div className="flex flex-row gap-4">
                        <div>
                          <MdDelete />
                        </div>
                        <div className="text-semibold m-">
                          <span>Delete</span>
                        </div>
                      </div>{" "}
                    </MenuItem> */}
                  </MenuList>
                </Menu>
              </div>
            );
          }
        });
        setUserTableList(resUserData);
        const userDetails = validResponse?.data?.update_assessors?.returning[0] ? validResponse?.data?.update_assessors?.returning[0] : validResponse?.data?.update_regulator?.returning[0]
        if (userDetails) {

          sendActivationStatusNotification(userDetails, 'active');
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "User activated successfully",
            toastType: "success",
          }));
        }
      }
     
    } catch (error) {
      console.log("error - ", error);
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

  const sendActivationStatusNotification = async (userDetails, status) => {
    // let mailBody = require('./json-files/mail-body.json');
    if (userDetails.email) {
      const emailBody = status === 'active' ? data.ACTIVATION_MAIL : data.INACTIVATION_MAIL;
      if (state.menu_selected === 'Assessor') {
        const emailData = {
          recipientEmail: [`${userDetails.email}`],
          emailSubject: `${emailBody.SUBJECT}`,
          emailBody:  `${emailBody.BODY.part1}${userDetails.name}${emailBody.BODY.part2}`
        };
        // sendEmailNotification(emailData)
      } else {
        const emailData = {
          recipientEmail: [`${userDetails.email}`],
          emailSubject: `${emailBody.SUBJECT}`,
          emailBody:  `${emailBody.BODY.part1}${userDetails.full_name}${emailBody.BODY.part2}`
        };
        // sendEmailNotification(emailData)
      }
    }
  }

  const handleUserDelete = (e) => {
    setSelectedUserId(e.user_id);
    setDeleteUsersModel(true);
  };

  const setTableData = (e) => {
    var usersData = {
      full_name: e.fname || e.lname ? e.fname + " " + e.lname : e.name,
      email: e.email?.toLowerCase(),
      mobile_number: e.phonenumber,
      role: e.role || "Assessor",
      status:
        e.workingstatus === "Valid"
          ? "Active"
          : e.workingstatus === "Invalid"
          ? "Inactive"
          : "-",
      id: e.user_id,
      code: e.code,
      schedule: (
        <div
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => handleViewSchedule(e)}
        >
          View Schedule
        </div>
      ),
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
                    `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
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
                onClick={() =>
                  e?.workingstatus === "Invalid"
                    ? handleUserSetValid(e)
                    : handleUsersetInvalid(e)
                }
              >
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdSwapHoriz />
                  </div>
                  <div className="text-semibold">
                    <span>
                      {e?.workingstatus === "Invalid"
                        ? "Activate"
                        : "Deactivate"}
                    </span>
                  </div>
                </div>{" "}
              </MenuItem>
             {/*  <MenuItem onClick={() => handleUserDelete(e)}>
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdDelete />
                  </div>
                  <div className="text-semibold">
                    <span>Delete</span>
                  </div>
                </div>{" "}
              </MenuItem> */}
            </MenuList>
          </Menu>
        </div>
      ),
    };
    resUserData.push(usersData);
  };
  const setAdminTableData = (e) => {
    var usersData = {
      full_name: e.fname || e.lname ? e.fname + " " + e.lname : e.name,
      email: e.email?.toLowerCase(),
      mobile_number: e.phonenumber,
      role: e.role === "Desktop-Admin" ? "Admin" : "Desktop-Assessor",
      status:
        e.workingstatus === "Valid"
          ? "Active"
          : e.workingstatus === "Invalid"
          ? "Inactive"
          : "-",
      id: e.user_id,
      schedule: (
        <div
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => handleViewSchedule(e)}
        >
          View Schedule
        </div>
      ),
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
                    `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
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
                onClick={() =>
                  e?.workingstatus === "Invalid"
                    ? handleUserSetValid(e)
                    : handleUsersetInvalid(e)
                }
              >
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdSwapHoriz />
                  </div>
                  <div className="text-semibold">
                    <span>
                      {e?.workingstatus === "Invalid"
                        ? "Activate"
                        : "Deactivate"}
                    </span>
                  </div>
                </div>{" "}
              </MenuItem>
             {/*  <MenuItem onClick={() => handleUserDelete(e)}>
                <div className="flex flex-row gap-4 p-1">
                  <div>
                    <MdDelete />
                  </div>
                  <div className="text-semibold">
                    <span>Delete</span>
                  </div>
                </div>{" "}
              </MenuItem> */}
            </MenuList>
          </Menu>
        </div>
      ),
    };
    resUserData.push(usersData);
  };

  const fetchAllAssessors = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
    };
    try {
      setSpinner(true);
      const res = await getAllAssessors(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessors_aggregate.aggregate.totalCount,
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

  const fetchAllRegulators = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
    };
    try {
      setSpinner(true);
      const res = await getAllRegulators(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.regulator_aggregate.aggregate.totalCount,
      }));
      //setUsersList(res?.data?.regulator);
      const data = res?.data?.regulator.reverse();
      data.forEach(setAdminTableData);
      const newData = resUserData.filter(user => user.role === "Admin");
      setUserTableList(newData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const getAllDeskTopAssessors = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      role: 'Desktop-Assessor'
    };
    try {
      setSpinner(true);
      const res = await fetchAllDeskTopAssessors(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.regulator_aggregate.aggregate.totalCount,
      }));
      console.log(res?.data?.regulator)
     // setUsersList(res?.data?.regulator);
      const data = res?.data?.regulator;
      data.forEach(setTableData);
      console.log(resUserData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const getAllInstitutes = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      role: 'Desktop-Assessor'
    };
    try {
      setSpinner(true);
      const res = await fetchAllInstitutes(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.regulator_aggregate.aggregate.totalCount,
      }));
      console.log(res?.data?.regulator)
     // setUsersList(res?.data?.regulator);
      const data = res?.data?.regulator;
      data.forEach(setTableData);
      console.log(resUserData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
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
      if (state.menu_selected === "Assessor") {
        setPaginationInfo((prevState) => ({
          ...prevState,
          totalCount: res.data.assessors_aggregate.aggregate.totalCount,
        }));
       // setUsersList(res?.data?.assessors);
        res?.data?.assessors.forEach(setTableData);
      }
      if (state.menu_selected === "Desktop-Admin") {
       
        const newData = res?.data?.regulator.filter(obj => {
          return obj.role === "Desktop-Admin";
        });
      
       // setUsersList(newData);
        
        newData.forEach(setAdminTableData);
       
        setPaginationInfo((prevState) => ({
          ...prevState,
          totalCount: resUserData.length,
        }));
        
      }
      if (state.menu_selected === "Desktop-Assessor") {
        
      //  setUsersList(res?.data?.regulator);
        
        const newData =  res?.data?.regulator.filter(obj => {
          return obj.role === "Desktop-Assessor";
        });
        
        newData.forEach(setAdminTableData);
        setPaginationInfo((prevState) => ({
          ...prevState,
          totalCount: resUserData.length,
        }));
      }
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
     /*  if (state.menu_selected === "Assessor") {
        await fetchAllAssessors();
      }
      if (state.menu_selected === "Desktop-Admin") {
        await fetchAllRegulators();
      }
      if (state.menu_selected === "Desktop-Assessor") {
        await getAllDeskTopAssessors();
      } */
      getUsersBasedOnMenuSelected();
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

      fetchAllAssessors();
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
    console.log("menuSelected =>", state.menu_selected);
    switch(state.menu_selected) {
      case 'Assessor': 
      for (let x in selectedRows) {
        if (selectedRows[x].status.toLowerCase() === "active") {
          const postData = { assessorId: selectedRows[x].user_id };
          const validResponse = await handleInctiveUser(postData);  
        } else if (selectedRows[x].status.toLowerCase() === "inactive") {
          const postData = { assessorId: selectedRows[x].user_id };
          const validResponse = await handleActiveUser(postData);
        }
      }
      await fetchAllAssessors();
      break;
      case 'Desktop-Admin': 
      for (let x in selectedRows) {
        if (selectedRows[x].status.toLowerCase() === "active") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleInctiveRegulatorUser(postData);  
        } else if (selectedRows[x].status.toLowerCase() === "inactive") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleActiveRegulatorUser(postData);
        }
      }
      await getAllRegulators();
      break;
      case 'Desktop-Assessor': 
      for (let x in selectedRows) {
        if (selectedRows[x].status.toLowerCase() === "active") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleInctiveRegulatorUser(postData);  
        } else if (selectedRows[x].status.toLowerCase() === "inactive") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleActiveRegulatorUser(postData);
        }
      }
      await getAllDeskTopAssessors();
      break;
      case 'Applicant': 
      alert('query to be added');
      await getAllInstitutes();
      break;
      case 'OGA Scheduler': 
      for (let x in selectedRows) {
        if (selectedRows[x].status.toLowerCase() === "active") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleInctiveRegulatorUser(postData);  
        } else if (selectedRows[x].status.toLowerCase() === "inactive") {
          const postData = { requlatorId: selectedRows[x].user_id };
          const validResponse = await handleActiveRegulatorUser(postData);
        }
      }
      // await getAllRegulators();
      break;
      case 'Report Analyst':
        for (let x in selectedRows) {
          if (selectedRows[x].status.toLowerCase() === "active") {
            const postData = { requlatorId: selectedRows[x].user_id };
            const validResponse = await handleInctiveRegulatorUser(postData);  
          } else if (selectedRows[x].status.toLowerCase() === "inactive") {
            const postData = { requlatorId: selectedRows[x].user_id };
            const validResponse = await handleActiveRegulatorUser(postData);
          }
        }
        // await getAllRegulators();
      break;
      default: 
      return;
    }
    
   
  };

  useEffect(() => {
    if (deleteFlag) {
      handleDelete(selectedUserId);
    }
  }, [deleteFlag]);

  useEffect(() => {
    if (bulkDeleteFlag) {
      // handleDelete(selectedUserId);
      handleBulkDelete(selectedRows);
    }
  }, [bulkDeleteFlag]);

  const getUsersBasedOnMenuSelected = () =>{
    switch (state.menu_selected) {
      case 'Assessor':
        fetchAllAssessors();
        break;
       case 'Desktop-Admin':
        fetchAllRegulators();
        break;
      case 'Desktop-Assessor':
        getAllDeskTopAssessors();
        break;
      case 'Applicant':
        // getAllInstitutes();
        break;
      default:
       // return null
    }
  }

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      console.log(state.menu_selected)
      /* if (state.menu_selected === "Assessor") {
        fetchAllAssessors();
      }
      if (state.menu_selected === "Desktop-Admin") {
        fetchAllRegulators();
      }
      if (state.menu_selected === "Desktop-Assessor") {
        getAllDeskTopAssessors();
      } */
      getUsersBasedOnMenuSelected();
    }
  }, [paginationInfo.offsetNo, paginationInfo.limit, state.menu_selected]);

  useEffect(() => {
    if (usersCreated) {
   /*    if (state.menu_selected === "Assessor") {
        fetchAllAssessors();
      }
      if (state.menu_selected === "Desktop-Admin") {
        fetchAllRegulators();
      }
      if (state.menu_selected === "Desktop-Assessor") {
        getAllDeskTopAssessors();
      } */
      getUsersBasedOnMenuSelected();
    }
    setUsersCreated(false);
  }, [usersCreated]);

  return (
    <>
      <Nav />

      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col justify-center align-center">
          <div className="flex flex-col justify-center align-center gap-4">
            <div className="flex flex-row">
              <div className="flex grow items-center">
                <h1 className="text-xl font-semibold">Manage Users</h1>
              </div>
              <div className="flex justify-end">
                <span className="flex gap-4">
                  {/* {state.menu_selected === "Assessor" && ( */}
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
                      text="Make Active/Inactive"
                    ></Button>
                  {/* )} */}
                  {/* <Button
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
                    text="Delete user"
                  ></Button> */}
                  <button
                    onClick={() => setBulkUploadUsersModel(true)}
                    className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-900 bg-white w-[200px] h-[45px] text-md font-medium rounded-[4px]"
                  >
                    Bulk upload users
                    <span className="text-xl">
                      <MdFileUpload />
                    </span>
                  </button>
                  <Button
                    moreClass="text-white"
                    text="Add User"
                    onClick={() =>
                      navigation(
                        `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}`
                      )
                    }
                  ></Button>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <ul className="flex flex-wrap gap-3 -mb-px">
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

                <li
                  className="mr-2"
                  onClick={() => handleSelectMenu("Desktop-Admin")}
                >
                  <a
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Desktop-Admin"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    Admin
                  </a>
                </li>

                <li
                  className="mr-2"
                  onClick={() => handleSelectMenu("Desktop-Assessor")}
                >
                  <a
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Desktop-Assessor"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    Desktop Assessor
                  </a>
                </li>
                <li
             //  style={{display:'none'}}
                  className="mr-2"
                  onClick={() => handleSelectMenu("Applicant")}
                >
                  <a 
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Applicant"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    Applicant
                  </a>
                </li>

                <li
             //  style={{display:'none'}}
                  className="mr-2"
                  onClick={() => handleSelectMenu("OGA Scheduler")}
                >
                  <a 
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "OGA Scheduler"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    OGA Scheduler
                  </a>
                </li>

                <li
             //  style={{display:'none'}}
                  className="mr-2"
                  onClick={() => handleSelectMenu("Report Analyst")}
                >
                  <a 
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Report Analyst"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    Report Analyst
                  </a>
                </li>
                
              </ul>
              {/* filtering table here */}
              {state.menu_selected === "Assessor" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={COLUMNS}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={true}
                    showSearch={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
              {state.menu_selected === "Desktop-Admin" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={ADMIN_COLUMN}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={false}
                    showSearch={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
               
               {state.menu_selected === "Desktop-Assessor" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={ADMIN_COLUMN}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={false}
                    showSearch={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
              {state.menu_selected === "Applicant" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={ADMIN_COLUMN}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={false}
                    showSearch={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setDeleteFlag}
          closeDeleteUsersModal={setDeleteUsersModel}
        />
      )}

      {deleteBulkUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setBulkDeleteFlag}
          closeDeleteUsersModal={setDeleteBulkUsersModel}
        />
      )}

      {bulkUploadUsersModel && (
        <BulkUploadUsersModal
          closeBulkUploadUsersModal={setBulkUploadUsersModel}
          setUsersCreated={setUsersCreated}
        />
      )}

      {viewScheduleModal && (
        <ViewScheduleModal
          closeViewSchedulesModal={setViewScheduleModal}
          scheduleUserData={scheduleUserData}
        ></ViewScheduleModal>
      )}
    </>
  );
}
