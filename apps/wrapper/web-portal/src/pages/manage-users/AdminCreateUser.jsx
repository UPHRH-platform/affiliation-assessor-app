import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";

import { FaAngleRight } from "react-icons/fa";

import { useForm } from "react-hook-form";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { Button, Label } from "../../components";
import { ContextAPI } from "../../utils/ContextAPI";

import {
  createBulkUserHasura,
  createBulkUsersKeyCloak,
  editUserHasura,
  editUserKeycloak,
  getSpecificUser,
  sendEmailNotification,
  checkIsEmailExist,
  fetchAllUserRoles
} from "./../../api";
import { userService } from "../../api/userService";
import { getCookie, removeCookie, setCookie } from "../../utils";
import messages from "../../assets/json-files/messages.json";

export default function AdminCreateUser() {
  let { userId } = useParams();
  const { setSpinner, setToast } = useContext(ContextAPI);
  let [emailValue, setEmailValue] = useState("");
  const [user, setUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phonenumber: "",
    role: "",
  });
  const [selectedRoleName, setSelectedRoleName] = useState();

  const [availableRoleNames, setAvailableRoleNames] = useState([]);
  const navigation = useNavigate();

  const fetchUser = async () => {
    try {
      setSpinner(true);
      const res = await getSpecificUser({ userId });
      if (res.data.assessors.length) {
        setSelectedRoleName({value: res.data.assessors[0]["role"],
        label: res.data.assessors[0]["role"],
      })
        setUser({
          firstname:
            res.data.assessors[0]["fname"] || res.data.assessors[0]["name"],
          lastname: res.data.assessors[0]["lname"],
          email: res.data.assessors[0]["email"],
          phonenumber: res.data.assessors[0]["phonenumber"],
          role: res.data.assessors[0]["role"],
        });
      }
      if (res.data.regulator.length) {
        setSelectedRoleName({value: res.data.regulator[0]["role"],
        label: res.data.regulator[0]["role"],})
        setUser({
          firstname:
            res.data.regulator[0]["fname"] ||
            res.data.regulator[0]["full_name"],
          lastname: res.data.regulator[0]["lname"],
          email: res.data.regulator[0]["email"],
          phonenumber: res.data.regulator[0]["phonenumber"],
          //role: res.data.regulator[0]["role"],
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(user.email);
  const isPhoneNumber = /^(?:(?:\(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(
    user.phonenumber
  );
  console.log("isPhone", isPhoneNumber);
  // setEmailValue(isEmail)
  // console.log("emailValue",emailValue)

  const handleChange = (name, value) => {
    setUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const upDateUserObj = () => {
    setUser((prevState) => ({
      ...prevState,
      role: selectedRoleName?.value,
    }));
  };
  const isFieldsValid = () => {
    if (
      user.firstname === "" ||
     // user.lastname === "" ||
      !isEmail ||
      user.email === "" ||
      user.role === "" || user.role === undefined ||
      user.phonenumber === "" ||
      !isPhoneNumber ||
      user.phonenumber.length > 10 ||
      user.phonenumber.length < 10
    ) {
      //  setErrMsg("Please fill in valid information");
      return false;
    } else return true;
  };

  const handleAlphaOnly = (value, nameFlag) => {
    const re = /^[a-zA-Z ]*$/;
    if (re.test(value)) {
      handleChange(nameFlag, value)
    }
  }

  const handleNumbersOnly = (value, nameFlag) => {
    const re = /^[0-9\b]+$/;
    if (value === '' || re.test(value)) {
      handleChange(nameFlag, value)
    }
  }

  const submitUserData = async (e) => {
    e.preventDefault();
    let errorFlag = false;
    let accessTokenObj = {
      grant_type: "client_credentials",
      client_id: "admin-api",
      client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
    };
    //Access Token API call
    // const accessTokenResponse = await userService.getAccessToken(
    //   accessTokenObj
    // );
    // setCookie(
    //   "access_token",
    //   "Bearer " + accessTokenResponse?.data?.access_token
    // );
    // if (accessTokenResponse.status !== 200) {
    //   errorFlag = true;
    // }

    setCookie("access_token", process.env.REACT_APP_AUTH_TOKEN);

    if (userId) {
      //for edit user

      try {
        setSpinner(true);
        let postDataKeyCloak = {
          userName: getCookie("regulator")[0]["user_id"],
          request: {
            firstName: user.firstname,
            lastName: user.lastname,
            enabled: true,
            email: user.email,
            emailVerified: false,
            credentials: [
              {
                type: "password",
                value: `${user.phonenumber}`,
                temporary: "false",
              },
            ],
            attributes: {
             // Role: user.role,
              Role:   selectedRoleName.value
            },
          },
        };
        //keycloak edit user
        const singleEditKeycloak = await editUserKeycloak(postDataKeyCloak);
        if (singleEditKeycloak.status !== 200) {
          errorFlag = true;
        }

        //hasura edit user
        let postDataHasura = {
          user_id: userId,
          fname: user.firstname,
          lname: user.lastname,
          full_name: user.firstname + " " + user.lastname,
          phno: user.phonenumber,
        };
        const singleEditHasura = await editUserHasura(postDataHasura);
        if (singleEditHasura.status !== 200) {
          errorFlag = true;
        }
        if (!errorFlag) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "User updated successfully!",
            toastType: "success",
          }));
          navigation(ADMIN_ROUTE_MAP.adminModule.manageUsers.home);
        }
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
    } else {
      // for create user
      let postDataKeyCloak = {};



      try {
        setSpinner(true);
        postDataKeyCloak = {
          request: {
            firstName: user.firstname,
            lastName: user.lastname,
            email: user.email,
            username: user.email,
            enabled: true,
            emailVerified: false,
            credentials: [
              {
                type: "password",
                value: `${user.phonenumber}`,
                temporary: "false",
              },
            ],
            attributes: {
             // Role: user.role,
              Role:  selectedRoleName.value === "Admin" ? "Desktop-Admin" : selectedRoleName.value
            },
          },
        };

        const checkIsEmailExistRes = await checkIsEmailExist({ email: user.email });
        if (checkIsEmailExistRes?.data
          && (checkIsEmailExistRes?.data?.assessors?.length
            || checkIsEmailExistRes?.data?.institutes?.length
            || checkIsEmailExistRes?.data?.regulator?.length)) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: 'Email is Already Registered.',
            toastType: "error",
          }));
        } else {

          //keycloak API call
          const keycloakRes = await createBulkUsersKeyCloak(postDataKeyCloak);

          if (keycloakRes?.status !== 200) {
            errorFlag = true;
          } else {
            createHasuraUser(keycloakRes)
          }
        }

      } catch (error) {
        console.log(error)
        // const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: error.message,
          toastType: "error",
        }));
      } finally {
        setSpinner(false);
      }
    }

  };

  const createHasuraUser = (async (keycloakRes) => {
    let postDataHasura = {
      assessors: [],
      regulators: [],
    };
    try {
      //Hasura API call
      if (keycloakRes.data) {
        if (user.role === "Assessor") {
          postDataHasura["assessors"].push({
            code: `${Math.floor(1000 + Math.random() * 9000)}`,
            user_id: keycloakRes.data,
            email: user.email,
            name: user.firstname + " " + user.lastname,
            phonenumber: user.phonenumber,
            fname: user.firstname,
            lname: user.lastname,
            role: user.role,
          });
        } else {
          postDataHasura["regulators"].push({
            user_id: keycloakRes.data,
            email: user.email,
            full_name: user.firstname + " " + user.lastname,
            phonenumber: user.phonenumber,
            fname: user.firstname,
            lname: user.lastname,
            role: user.role === "Admin" ? "Desktop-Admin" : user.role,
          });
        }
     /*    if (user.role === "Desktop-Admin" || user.role === "Desktop-Assessor") {
        
        } */
      }
      const hasuraRes = await createBulkUserHasura(postDataHasura);
      if (hasuraRes.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "User created successfully!",
          toastType: "success",
        }));
        sendAccountCreationNotification(user)
        navigation(ADMIN_ROUTE_MAP.adminModule.manageUsers.home);
        removeCookie("access_token");;
      }


    } catch (error) {
      const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: errorMessage,
        toastType: "error",
      }));
    }

  }
  )

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
  const fetchUserRoleNames = async (userDetails) => {

    const reqBody =   {object:{active: {_eq: true}}, offsetNo: 0, limit: 100}

    try {
      setSpinner(true);
      const res = await fetchAllUserRoles(reqBody);
      let arr = []
      res.data.role.forEach(elem => {
      //  console.log(elem.name)
        arr.push({
          label: elem.name,
          value: elem.name
        })
      });
      setAvailableRoleNames(arr)
    } catch (e) {
      console.log(e)
    } finally {
      setSpinner(false);
    }

  }

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRoleNames();
  }, []);

  useEffect(() => {
    console.log(selectedRoleName)
    upDateUserObj();
  }, [selectedRoleName]);


  return (
    <>
      {/* Breadcrum */}
      {/* <Breadcrumb data={breadCrumbData} /> */}
      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.manageUsers.home}>
              <span className="text-primary-400 cursor-pointer">
                Manage Users
              </span>
            </Link>
            <FaAngleRight className="text-gray-500 text-[16px]" />
            {/* <Link to={ADMIN_ROUTE_MAP.adminModule.manageUsers.home}> */}
            <span className="text-gray-500">Create user</span>
            {/* </Link> */}
        
          </div>
        </div>
      </div>
      <div>
        <div
          className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}
        >
          <form>
            <div className="flex flex-row mb-4 justify-between">
              <h1 className="text-2xl font-bold">User details</h1>
            </div>
            <div className="flex flex-row justify-between bg-white h-[560px] rounded-[4px] p-8 mx-auto">
              <div className="w-1/2">
                <h1 className="text-xl font-semibold">User details</h1>
                <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Label
                      htmlFor="firstname"
                      text="First name"
                      required
                    ></Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Type here"
                        id="firstname"
                        name="firstname"
                        value={user.firstname}
                        onChange={(e) =>
                          handleAlphaOnly(e.target.value, "firstname")
                        }
                        // disabled={userId?true:false}
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor="lastname" text="Last name" ></Label>
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
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Label htmlFor="email" text="Email Id" required></Label>
                    <div className="mt-2">
                      <input
                        type="email"
                        placeholder="Type here"
                        id="email"
                        name="email"
                        defaultValue={user.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        disabled={userId ? true : false}
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <Label
                      htmlFor="phonenumber"
                      text="Phone number"
                      required
                    ></Label>
                    <div className="mt-2">
                      <input
                        type="tel"
                        placeholder="Type here"
                        name="phonenumber"
                        id="phonenumber"
                        maxLength={10}
                        value={user.phonenumber}
                        onChange={(e) =>
                          handleNumbersOnly(e.target.value, "phonenumber")
                        }
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3 ">
                    <Label
                      required
                      text="Role"
                      htmlFor="role"
                      moreClass="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
                    />

                    {/*  <select
                      required
                      value={user.role}
                      disabled={userId ? true : false}
                      name="role"
                      id="role"
                      onChange={(e) => handleChange("role", e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="">Select role</option>
                      <option value="Assessor">On Ground Assessor</option>
                      <option value="Desktop-Admin">Admin</option>
                      <option value="Desktop-Assessor">Desktop Assessor</option>
                    </select> */}
                    <Select
                      name="allRolesList"
                      label="Role"
                      isDisabled={userId ? true : false}
                      value={selectedRoleName}
                      onChange={setSelectedRoleName}
                      options={availableRoleNames}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 ">
                <div className="footer flex flex-row gap-4 justify-end">
                  <Button
                    onClick={() => {
                      navigation(ADMIN_ROUTE_MAP.adminModule.manageUsers.home);
                    }}
                    moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                    text="Cancel"
                  ></Button>
                  <Button
                    moreClass="border text-white w-[120px]"
                    text={!userId ? "Submit" : "Save"}
                    otherProps={{
                      disabled: !isFieldsValid(),
                    }}
                    onClick={submitUserData}
                  ></Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
