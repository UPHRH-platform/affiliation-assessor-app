import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams, NavLink } from "react-router-dom";
import Select from "react-select";
import { FaAngleRight } from "react-icons/fa";

import { MdRefresh } from "react-icons/md";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { Button, Label } from "../../components";
import { ContextAPI } from "../../utils/ContextAPI";

import {
  createBulkUserHasura,
  createBulkUsersKeyCloak,
  createRole,
  editRole,
  fetchAllUserRoles,
  sendEmailNotification,
  checkIsEmailExist
} from "../../api";
import messages from "../../assets/json-files/messages.json";

export default function CreateUpdateRole() {
  const { roleId } = useParams();
  const { setSpinner, setToast } = useContext(ContextAPI);
  const [user, setUser] = useState({ name: "" });
  const [roleName, setRoleName] = useState("");

  const navigation = useNavigate();

  const [availableTabsList, setAvailableTabsList] = useState([

  ]);

  const [selectedTabsList, setSelectedTabsList] = useState([
  ]);

  const [selectedAvailableOptions, setSelectedAvailableOptions] = useState([]);
  const [chosenSelectedTabs, setChosenSelectedTabs] = useState([]);
  const [hideSelectBox, setHideSelectBox] = useState("initial");

  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedModuleName, setSelectedModuleName] = useState("");

  const [modulesList, setModulesList] = useState([
    { value: 'Regulator-portal', label: 'Regulator-portal' },
     { value: 'Assessor-app', label: 'Assessor-app' },
  ]);
   
  let callCheckVar = true;

  const fetchRole = async () => {
    try {
      setSpinner(true);
      const reqBody = {
        object: {
          active: {
            _eq: true
          },
          id: {
            _eq: roleId
          }
        },
        offsetNo: 0,
        limit: 100
      }
      // fetchAllUserRoles returns unique role if roleid is passed
      const res = await fetchAllUserRoles(reqBody);
      console.log(res.data.role[0].permissions)
      if (res.data.role_aggregate.aggregate.count === 1) {
        setRoleName(res.data.role[0].name)
        const currentModulesArr = [];
        res.data.role[0].permissions?.module?.forEach(element => {
          const currentModule = {
            label: element,
            value: element
          }
          currentModulesArr.push(currentModule)
        });

        setSelectedModules(currentModulesArr)
        /*  setModulesList( [  { value: 'Desktop Analysis screen', label: 'Desktop Analysisssss' },
         { value: 'Form Management Screen', label: 'Form Management' },
         { value: 'User Management Screen', label: 'User Management' },
         { value: 'Schedule Management Screen', label: 'Schedule Management' }]) */

        setModulesList(removeFromArray(modulesList, ...selectedModules));


        fetchDefaultSelectedPages(res.data.role[0].permissions.action[0].pages);
      }

    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  const fetchAllAvailablePages = async () => {
    console.log("caaaal....")

    /*    { value: 'Desktop Analysis screen', label: 'Desktop Analysis' },
       { value: 'Form Management Screen', label: 'Form Management' },
       { value: 'User Management Screen', label: 'User Management' },
       { value: 'Schedule Management Screen', label: 'Schedule Management' }, */



    const data = [
      {
        "id": 1,
        "name": "DASHBOARD",
        "module": "Regulator-portal"
      },
      {
        "id": 2,
        "name": "USER-MANAGEMENT",
        "module": "Regulator-Portal"
      },
      {
        "id": 3,
        "name": "FORM-MANAGEMENT",
        "module": "Regulator-Portal"
      },
      {
        "id": 2,
        "name": "DESKTOP-ANALYSIS",
        "module": "Regulator-Portal"
      }, ,
      {
        "id": 2,
        "name": "SCHEDULE-MANAGEMENT",
        "module": "Regulator-Portal"
      }, ,
      {
        "id": 2,
        "name": "ON-GROUND-INSPECTION-ANALYSIS",
        "module": "Regulator-Portal"
      }, ,
      {
        "id": 2,
        "name": "CERTIFICATE-MANAGEMENT",
        "module": "Regulator-Portal"
      }, ,
      {
        "id": 2,
        "name": "ROLE-MANAGEMENT",
        "module": "Regulator-Portal"
      }
    ]
    const arr = []
    data.forEach(elem => {

      arr.push({
        label: elem.name,
        value: elem.name
      })

    });
    console.log(arr)
    setAvailableTabsList(getDifferenceFromArray(arr, selectedTabsList));
    // setAvailableTabsList(arr)
  }


  const fetchDefaultSelectedPages = async (pages) => {

    const arr = []
    pages.forEach(element => {
      arr.push({
        label: element,
        value: element
      })
    });
    setSelectedTabsList(arr)
    /*   if(selectedTabsList.length){
         fetchAllAvailablePages()
      } */
  };

  const handleChange = (name, value) => {

  };

  const removeFromArray = function (arr, ...theArgs) {
    return arr.filter(val => !theArgs.includes(val))
  };

  const getDifferenceFromArray = function (array1, array2) {
    return array1.filter(object1 => {
      return !array2.some(object2 => {
        return object1.label === object2.label;
      });
    });
  }

  const addToSelectedTabsList = (e) => {
    //console.log(selectedAvailableOptions )
    setSelectedTabsList(prevState => [...prevState, ...selectedAvailableOptions]);

    //console.log(selectedTabsList)
    setAvailableTabsList(removeFromArray(availableTabsList, ...selectedAvailableOptions));
    setSelectedAvailableOptions([]);
    callCheckVar = false
  }

  const addToAvailableTabsList = (e) => {
    setAvailableTabsList(prevState => [...prevState, ...chosenSelectedTabs]);
    setSelectedTabsList(removeFromArray(selectedTabsList, ...chosenSelectedTabs))
    setChosenSelectedTabs([])
    callCheckVar = false
  }

  const refreshTabsList = (e) => {

  }

  const isFieldsValid = () => {
    if(setSelectedModuleName?.value?.toLowerCase() === "regulator-portal"){
      if (roleName === "" || selectedModuleName === "" || !selectedTabsList?.length
      ) {
        //  setErrMsg("Please fill in valid information");
        return false;
      } else return true;
    } else 
    {
      if (roleName === "" || selectedModuleName === "" 
      ) {
        //  setErrMsg("Please fill in valid information");
        return false;
      } else return true;
    }
   
  };

  const handleAlphaOnly = (value) => {
    const re = /^[a-zA-Z ]*$/;
    if (re.test(value)) {
      // handleChange(nameFlag, value)
      setRoleName(value)
    }
  }

  const handleNumbersOnly = (value, nameFlag) => {
    const re = /^[0-9\b]+$/;
    if (value === '' || re.test(value)) {
      handleChange(nameFlag, value)
    }
  }

  const submitRoleData = async (e) => {
    let errorFlag = false;
    console.log(roleName)
    console.log(selectedTabsList)
    console.log(selectedModuleName.value)
    let moduleArr = []
    moduleArr.push(selectedModuleName.value)
    let selectedTabsArr = []
    selectedTabsList.forEach(element => {
      selectedTabsArr.push(element.value)
    });

    if (roleId) {
      //for edit role
      try {
        setSpinner(true);
        //hasura edit role
        const postDataHasura = {
          id: roleId,
          "param": {
            "active": true,
            "name": roleName,
            "permissions": {
              "role": roleName,
              "action": [
                {
                  "pages": selectedTabsArr,
                  "module": selectedModuleName.value,
                  "sub-pages": [
                    {
                      "name": "Rejected",
                      "action": [
                        "read"
                      ]
                    },
                    {
                      "name": "Approved",
                      "action": [
                        "read",
                        "write"
                      ]
                    }
                  ]
                }
              ],
              "module": moduleArr
            }
          }
        };
        const editEditHasuraResp = await editRole(postDataHasura);
        if (editEditHasuraResp.status !== 200) {
          errorFlag = true;
        }
        if (!errorFlag) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "Role updated successfully! It would take 1 hour to reflect the changes",
            toastType: "success",
          }));
          navigation(ADMIN_ROUTE_MAP.adminModule.roleManagement.home);
        }
      } catch (error) {
        // const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Failed to update role details.",
          toastType: "error",
        }));
      } finally {
        setSpinner(false);
      }
    } else {
      // for create role
      try {
        setSpinner(true);
        let reqBody = {
          "object": {
            "name": {
              "_eq": roleName
            }
          },
          "offsetNo": 0,
          "limit": 100
        }

        const checkIsRoleExistRes = await fetchAllUserRoles(reqBody);
        console.log(checkIsRoleExistRes)
        if (checkIsRoleExistRes.data
          && (checkIsRoleExistRes.data.role.length)) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: 'Role exists in the system.',
            toastType: "error",
          }));
        } else {

          const reqBody = {
            object: {
              "name": roleName,
              "active": true,
              "created_by": 1,
              "updated_by": 1,
              "permissions": {
                "role": roleName,
                "action": [
                  {
                    "pages": selectedTabsArr,
                    "module": selectedModuleName.value,
                    "sub-pages": [
                      {
                        "name": "Rejected",
                        "action": [
                          "read"
                        ]
                      },
                      {
                        "name": "Approved",
                        "action": [
                          "read",
                          "write"
                        ]
                      }
                    ]
                  }
                ],
                "module": moduleArr
              }
            }
          }

          createHasuraRole(reqBody)
        }

      } catch (error) {
        console.log(error)
        // const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Failed to update role details.",
          toastType: "error",
        }));
      } finally {
        setSpinner(false);
      }
    }

  };

  const createHasuraRole = async (reqBody) => {

    console.log(reqBody)

    try {
      //Hasura API call
      const hasuraRes = await createRole(reqBody);
      if (hasuraRes.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Role created successfully!",
          toastType: "success",
        }));
        // sendAccountCreationNotification(user)
        navigation(ADMIN_ROUTE_MAP.adminModule.roleManagement.home);
        // removeCookie("access_token");;
      }


    } catch (error) {
      //const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Failed to create new user role.",
        toastType: "error",
      }));
    }

  }


  const sendAccountCreationNotification = async (userDetails) => {
    if (userDetails.email) {
      let emailData = {}
      if (userDetails.role === 'Assessor') {
        const emailBody = messages.ACCOUNT_CREATED_PASSWORD_BASED_LOGIN_MAIL;
        emailData = {
          recipientEmail: [`${userDetails.email}`],
          emailSubject: `${emailBody.SUBJECT}`,
          emailBody: `${emailBody.BODY.part1}${userDetails.firstname} ${userDetails.lastname}${emailBody.BODY.part2}${userDetails.email}${emailBody.BODY.part3}${userDetails.phonenumber}${emailBody.BODY.part4}`
        };
      } else {
        const emailBody = messages.ACCOUNT_CREATED_OTP_BASED_LOGIN_MAIL;
        emailData = {
          recipientEmail: [`${userDetails.email}`],
          emailSubject: `${emailBody.SUBJECT}`,
          emailBody: `${emailBody.BODY.part1}${userDetails.firstname} ${userDetails.lastname}${emailBody.BODY.part2}${userDetails.email}${emailBody.BODY.part3}${userDetails.phonenumber}${emailBody.BODY.part4}`
        };
      }
      // sendEmailNotification(emailData)
    }
  }

  useEffect(() => {
    console.log(roleId)
    if (roleId) {
      fetchRole();
    } else {
      fetchAllAvailablePages();
    }
  }, [roleId]);

  useEffect(() => {
    console.log(callCheckVar)
    if(callCheckVar){
      fetchAllAvailablePages();
      callCheckVar = false
    }
  }, [selectedTabsList]);

  useEffect(() => {
    console.log(selectedModuleName?.value)
    if(selectedModuleName?.value?.toLowerCase() === "assessor-app"){
      setHideSelectBox("none")
    } else {
      setHideSelectBox("initial")
    }
  }, [selectedModuleName]);




  return (
    <>
      {/* Breadcrum */}
      {/* <Breadcrumb data={breadCrumbData} /> */}
      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.roleManagement.home}>
              <span className="text-primary-400 cursor-pointer">
                Manage Roles
              </span>
            </Link>
            <FaAngleRight className="text-gray-500 text-[16px]" />
            {/* <Link to={ADMIN_ROUTE_MAP.adminModule.manageUsers.home}> */}
            <span className="text-gray-500">Create role</span>
            {/* </Link> */}
            {/* <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500 uppercase">User details</span> */}
          </div>
        </div>
      </div>
      <div>
        <div
          className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}
        >
          <div className="flex flex-row mb-4 justify-between">
            <h1 className="text-2xl font-bold">Role details</h1>

          </div>
          <div className="flex flex-row justify-between bg-white h-[800px] rounded-[4px] p-8 mx-auto">
            <div className="w-3/4">
              <h1 className="text-xl font-semibold">Role details</h1>
              <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Label
                    htmlFor="firstname"
                    text="Role name"
                    required
                  ></Label>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Type here"
                      value={roleName}
                      onChange={(e) => handleAlphaOnly(e.target.value)}
                      disabled={roleId ? true : false}
                      className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                {/*   <div className="sm:col-span-3">
                    <Label htmlFor="lastname" text="Last name" required></Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Type here"
                        name="lastname"
                        id="lastname"
                        value={user.lastname}
                        onChange={(e) =>
                          handleAlphaOnly(e.target.value, "lastname")
                        }
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      // disabled={userId?true:false}
                      />
                    </div>
                  </div> */}
              </div>

              <div className="w-[230px] mt-9 grid grid-cols-1">

                <Label
                  required
                  text="Module"
                  htmlFor="role"
                  moreClass="text-sm font-medium text-gray-900 dark:text-gray-400"
                />
                {/*  <select
                      required
                      value={user.role}
                     // disabled={roleId ? true : false}
                      name="role"
                      id="role"
                      onChange={(e) => handleChange("role", e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="">Select Module*</option>
                      <option value="Assessor">OGA Assessor App</option>
                      <option value="Desktop-Admin">Regulator Portal</option>
                      <option value="Desktop-Assessor">Applicant Portal</option>
                    </select> */}
                <Select
                  name="modules"
                  label="Module"
                  value={selectedModuleName}
                  onChange={setSelectedModuleName}
                  options={modulesList}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              </div>
              <div className="mt-10  ">
                <div className="w-[777px]"  style={{ display: hideSelectBox }}>

                  <div className="flex-parent-element">
                    <div className="flex-child-element border border-gray-200">
                      <p className="m-2"> Available Screens</p>
                      <hr />
                      <Select
                        isMulti
                      
                        name="allTabsList"
                        label="Available tabs"
                        value={selectedAvailableOptions}
                        onChange={setSelectedAvailableOptions}
                        options={availableTabsList}
                        className="w-[380px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                   
                    </div>
                    <div className="w-[230px] flex-child-element green">
                      <Button type="button"
                        onClick={() => { addToSelectedTabsList() }}
                        moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                        text=">"
                      ></Button>

                      <Button
                        onClick={() => addToAvailableTabsList()
                        }
                        moreClass="mt-3 border border-gray-200 bg-white text-blue-600 w-[120px]"
                        text="<"
                      ></Button>

                      {/* <Button
                          onClick={() => {refreshTabsList()
                          }}
                          moreClass="mt-3 border border-gray-200 bg-white text-blue-600 w-[120px]"
                          text="<"
                        ></Button> */}
                      {/*  <NavLink
                        moreClass="border border-gray-200">
                        <MdRefresh className="text-white text-xl ml-12 mt-2" 
                        
                         onClick={() => {refreshTabsList()
                         }}
                         />
                      </NavLink> */}

                    </div>

                    <div className="flex-child-element border border-gray-200">
                      <p className="m-2"> Selected Screens</p>
                      <hr />
                      <Select
                        isMulti
                        name="selectedTabsList"
                        label="Selected tabs"
                        value={chosenSelectedTabs}
                        onChange={setChosenSelectedTabs}
                        options={selectedTabsList}
                        className="w-[400px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col  ">
              <div className="footer flex flex-row gap-4 justify-end">
                <Button
                  onClick={() => {
                    navigation(ADMIN_ROUTE_MAP.adminModule.roleManagement.home);
                  }}
                  moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                  text="Cancel"
                ></Button>
                <Button
                  moreClass="border text-white w-[120px]"
                  text={!roleId ? "Submit" : "Save"}
                  otherProps={{
                    disabled: !isFieldsValid(),
                  }}
                  onClick={submitRoleData}
                ></Button>
              </div>
            </div>


          </div>


        </div>
      </div>
    </>
  );
}
