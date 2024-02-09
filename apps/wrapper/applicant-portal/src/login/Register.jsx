import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, Label } from "../components";
import { setCookie, getCookie, removeCookie } from "../utils";

import { FaAngleRight } from "react-icons/fa";
import Toast from "../components/Toast";
import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";
import { userService, applicantService } from "../services";
import { forkJoin, lastValueFrom } from "rxjs";
import { UP_DISTRICTS } from "../utils/constants";
import { ContextAPI } from "../utils/contextAPI";
import messages from "../assets/json_files/messages.json";

export default function SelfRegistration() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { setToast } = useContext(ContextAPI);

  const signupHandler = async (data) => {
    const {
      firstName,
      lastName,
      applicantName,
      applicantType,
      courseType,
      email,
      mobilePhone,
      district,
      address,
    } = data;
    let userDetails = {
      request: {
        firstName,
        lastName,
        email,
        username: email,
        enabled: true,
        emailVerified: false,
        credentials: [
          {
            type: "password",
            value: `${mobilePhone}`,
            temporary: "false",
          },
        ],
        attributes: {
          Role: applicantType,
          module: "affiliation",
        },
      },
    };
    const instituteDetails = {
      instituteName: applicantName,
      district: district, // Capture it from UI once field is added
      email: email,
      address: address, // Capture it from UI once field is added
      course_applied: courseType,
    };

    const institutePocDetils = {
      fname: firstName,
      lname: lastName,
      name: `${firstName} ${lastName}`,
      phoneNumber: mobilePhone,
      user_id: "",
      institute_id: "",
    };

    try {
      const checkIsEmailExistRes = await applicantService.checkIsEmailExist({ email: email });
    
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
        try {
          const keyCloakSignupRes = await userService.signup(userDetails);
          console.log(keyCloakSignupRes);
  
          const addInstituteRes = await applicantService.addInstitute(
            instituteDetails
          )
         // console.log(addInstituteRes);
  
          institutePocDetils.user_id = keyCloakSignupRes.data;
          institutePocDetils["institute_id"] =
            addInstituteRes.data.insert_institutes_one.id;
          const addInstitutePocRes = await applicantService.addInstitutePoc(
            institutePocDetils
          ).then(
            setToast((prevState) => ({
              ...prevState,
              toastOpen: true,
              toastMsg: "You are successfully registered as an Applicant",
              toastType: "success",
            }))
          );
          //console.log(addInstitutePocRes);
  
          //institute update API to add Parent center code
          const res = await applicantService.updateParentCode({ "institute_id": addInstituteRes.data.insert_institutes_one.id, "parent_code": `P${addInstituteRes.data.insert_institutes_one.id}` })
  
          //applicant notification
          applicantService.sendPushNotification({
            title: "Applicant Registration",
            body: `You are successfully registered as an Applicant`,
            deviceToken: [`${getCookie("firebase_client_token")}`],
            userId: keyCloakSignupRes.data,
          });
  
          //email notify
          // const emailBody = messages.ACCOUNT_CREATED_OTP_BASED_LOGIN_MAIL;
          // const emailData = {
          //   recipientEmail: [`${userDetails.request.email}`],
          //   emailSubject: `${emailBody.SUBJECT}`,
          //   emailBody: `${emailBody.BODY.part1}${userDetails.request.firstName} ${userDetails.request.lastName}${emailBody.BODY.part2}${userDetails.request.email}${emailBody.BODY.part3}${userDetails.request.credentials[0].value}${emailBody.BODY.part4}`
          // };
  
          // applicantService.sendEmailNotification(emailData);
  
          navigate(APPLICANT_ROUTE_MAP.dashboardModule.congratulations);
        } catch (error) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "Error occured during applicant registration",
            toastType: "error",
          }));
        }
       
      }
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "User already registered.",
        toastType: "error",
      }));
      console.error("Registration failed due to some error:", error);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={APPLICANT_ROUTE_MAP.dashboard}>
              <span className="text-primary-400 cursor-pointer">Home</span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500">Self Registration</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Self Registration</h1>
          <form
            onSubmit={handleSubmit((data) => {
              signupHandler(data);
            })}
          >
            <div className="flex flex-row justify-between bg-white rounded-[4px] w-full p-8 mx-auto">
              <div className="w-1/2">
                <h1 className="text-xl font-semibold">Basic Details</h1>
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
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("firstName", {
                          required: true,
                          maxLength: 20,
                          pattern: /^[A-Za-z ]+$/i,
                        })}
                      />
                      {errors?.firstName?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                      {errors?.firstName?.type === "maxLength" && (
                        <p className="text-red-500 mt-2 text-sm">
                          First name cannot exceed 20 characters
                        </p>
                      )}
                      {errors?.firstName?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Alphabetical characters only
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor="lastname" text="Last name" required></Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Type here"
                        name="lastname"
                        id="lastname"
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("lastName", {
                          required: true,
                          maxLength: 20,
                          pattern: /^[A-Za-z ]+$/i,
                        })}
                      />
                      {errors?.lastName?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                      {errors?.lastName?.type === "maxLength" && (
                        <p className="text-red-500 mt-2 text-sm">
                          First name cannot exceed 20 characters
                        </p>
                      )}
                      {errors?.lastName?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Alphabetical characters only
                        </p>
                      )}
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
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("email", {
                          required: true,
                          pattern:
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i,
                        })}
                      />
                      {errors?.email?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                      {errors?.email?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This is not a valid email format
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <Label
                      htmlFor="phonenumber"
                      text="Phonenumber"
                      required
                    ></Label>
                    <div className="mt-2">
                      <input
                        type="tel"
                        placeholder="Type here"
                        name="phonenumber"
                        id="phonenumber"
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("mobilePhone", {
                          required: true,
                          maxLength: 10,
                          pattern: /^(?:(?:\(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/,
                        })}
                      />
                      {errors?.mobilePhone?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                      {errors?.mobilePhone?.type === "maxLength" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Phone number cannot exceed 10 characters
                        </p>
                      )}
                      {errors?.mobilePhone?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Please provide valid phone number
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Label
                      htmlFor="applicantname"
                      text="Applicant name"
                      required
                    ></Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Type here"
                        id="applicantname"
                        name="applicantname"
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("applicantName", {
                          required: true,
                          maxLength: 50,
                          pattern: /^[a-zA-Z ]*$/,
                        })}
                      />
                      {errors?.applicantName?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                      {errors?.applicantName?.type === "maxLength" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Applicant name cannot exceed 50 characters
                        </p>
                      )}
                      {errors?.applicantName?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Alphabetical characters only
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-3 ">
                    <Label
                      htmlFor="applicanttype"
                      text="Applicant type"
                      required
                    ></Label>
                    <div className="mt-2">
                      <select
                        className="bg-white block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        label="Select here"
                        id="applicanttype"
                        name="applicanttype"
                        {...register("applicantType", {
                          required: true,
                        })}
                      >
                        <option value="Institute">Institute</option>
                      </select>
                      {errors?.applicantType?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3 ">
                    <Label htmlFor="district" text="District" required></Label>
                    <div className="mt-2">
                      <select
                        className="bg-white block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        label="Select here"
                        id="district"
                        name="district"
                        {...register("district", {
                          required: true,
                        })}
                      >
                        {UP_DISTRICTS.map((district, idx) => (
                          <option key={idx} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {errors?.applicantType?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor="address" text="Address" required></Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Type here"
                        id="address"
                        name="address"
                        className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...register("address", {
                          required: true,
                          pattern: /[A-Za-z0-9'\.\-\s\,]/,
                        })}
                      />
                      {errors?.address?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}

                      {errors?.address?.type === "pattern" && (
                        <p className="text-red-500 mt-2 text-sm">
                          Alphabetical characters only
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3 ">
                    <Label
                      htmlFor="coursetype"
                      text="Course name"
                      required
                    ></Label>
                    <div className="mt-2">
                      <select
                        className="bg-white block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        label="Select here"
                        id="coursetype"
                        name="courseType"
                        {...register("courseType", {
                          required: true,
                        })}
                      >
                        <option value="Nursing">Nursing</option>
                        <option value="Paramedical">Paramedical</option>
                      </select>
                      {errors?.courseType?.type === "required" && (
                        <p className="text-red-500 mt-2 text-sm">
                          This field is required
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row justify-end h-1/2 my-auto mb-0 gap-2">
                <Button
                  moreClass="px-6 text-primary-600"
                  style={{ backgroundColor: "#fff" }}
                  text="Cancel"
                  onClick={goBack}
                ></Button>
                <Button
                  moreClass="px-6 text-white"
                  text="Submit"
                  type="submit"
                ></Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
