import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, Label } from "../components";

import { FaAngleRight } from "react-icons/fa";

import Toast from "../components/Toast";

// import { removeCookie, getCookie, getInitials } from "../utils";

import { getCookie, setCookie } from "../utils";

import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";

import { profileService, userService } from "../services";
import { editUserKeycloak } from "../services/userService";
import { ContextAPI } from "../utils/contextAPI";

export default function Profile() {
  const instituteData = getCookie("institutes");
  const userData = getCookie("userData");

  const [text, setText] = useState("Edit");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    course_type: "",
    district: "",
    address: "",
  });
  const navigate = useNavigate();
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPreview) {
      handleEditProfile();
    }
  };

  const [formState, setFormState] = useState(1);
  const [isPreview, setIsPreview] = useState(true);
  const { setToast } = useContext(ContextAPI);

  useEffect(() => {
    getProfileDetails();
  }, []);

  const handleEditProfile = async () => {
    //console.log("data", formData);
    let errorFlag = false;

    const instituteEditDetails = {
      institute_id: instituteData[0]?.id,
      institute_name: instituteData[0]?.name,
      // institute_email: instituteDetails.email,
      institute_course: formData?.course_type,
      institutePOC_fname: formData?.first_name,
      institutePOC_lname: formData?.last_name,
      institutePOC_name: formData?.name,
      institutePOC_phno: formData?.phone_number,
    };

    try {

      const postDataKeyCloak = {
        userName: userData?.id,
        request: {
          firstName: formData?.first_name,
          lastName: formData?.last_name,
          email: userData?.email,
          enabled: true,
          emailVerified: false,
          credentials: [
            {
              type: "password",
              value: `${formData?.phone_number}`,
              temporary: "false",
            },
          ],
          attributes: {
            Role: "Institute",
          },
        },
      };
      // keycloak edit user
      const singleEditKeycloak = await editUserKeycloak(postDataKeyCloak);
      if (singleEditKeycloak.status !== 200) {
      }
      if (singleEditKeycloak.status !== 200) {
        errorFlag = true;
      }

      const response = await profileService.getProfileEdit(
        instituteEditDetails
      );
      if (response.status !== 200) {
        errorFlag = true;
      }
      if (!errorFlag) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Updated user profile successfully.",
          toastType: "success",
        }));
        navigate(APPLICANT_ROUTE_MAP.dashboardModule.my_applications);
      }
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Failed to edit user profile details.",
        toastType: "error",
      }));
      console.error("Registration failed due to some error:", error);
    }
  };

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const getProfileDetails = async () => {
    const instituteViewDetails = {
      institute_id: instituteData[0]?.id,
    };

    try {
      const response = await profileService.getProfileView(
        instituteViewDetails
      );
      const formDetail = response.data.institutes[0];
      setFormData({
        first_name: formDetail?.institute_pocs[0]?.fname,
        last_name: formDetail?.institute_pocs[0]?.lname,
        phone_number: formDetail?.institute_pocs[0]?.number,
        email: userData?.email,
        name: formDetail?.institute_pocs[0]?.name,
        // applicant_type: [applicantType],
        course_type: formDetail?.course_applied,
        district: formDetail?.district,
        address: formDetail?.address,
      });
    } catch (error) {
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Failed to load user profile.",
        toastType: "error",
      }));
      console.error("Can not see profile due to some error:", error);
    }
  };

  return (
    <>
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={APPLICANT_ROUTE_MAP.dashboardModule.my_applications}>
              <span className="text-primary-400 cursor-pointer">
                My Application
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500">Profile</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">My Profile</h1>

          <form>
            {formState === 1 && (
              <div className="flex flex-row justify-between bg-white rounded-[4px] w-full p-8 mx-auto">
                <div className="w-1/2">
                  <h1 className="text-xl font-semibold">Applicant Details</h1>
                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <Label
                        htmlFor="first_name"
                        text="First name"
                        required
                      ></Label>
                      <div className="mt-2">
                        <input
                          onChange={handleChange}
                          defaultValue={formData.first_name}
                          type="text"
                          placeholder="Type here"
                          disabled={isPreview}
                          id="first_name"
                          name="first_name"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <Label
                        htmlFor="last_name"
                        text="Last name"
                        required
                      ></Label>
                      <div className="mt-2">
                        <input
                          type="text"
                          defaultValue={formData.last_name}
                          disabled={isPreview}
                          onChange={handleChange}
                          placeholder="Type here"
                          name="last_name"
                          id="last_name"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <Label htmlFor="email" text="Email Id" required></Label>
                      <div className="mt-2">
                        <input
                          defaultValue={formData.email}
                          disabled={true}
                          onChange={handleChange}
                          type="email"
                          placeholder="Type here"
                          id="email"
                          name="email"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <Label
                        htmlFor="phone_number"
                        text="Phonenumber"
                        required
                      ></Label>
                      <div className="mt-2">
                        <input
                          defaultValue={formData.phone_number}
                          disabled={isPreview}
                          onChange={handleChange}
                          type="tel"
                          placeholder="Type here"
                          name="phone_number"
                          id="phone_number"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3 ">
                      <Label
                        htmlFor="applicant_type"
                        text="Applicant type"
                        required
                      ></Label>
                      <div className="mt-2">
                        <select
                          defaultValue={formData.applicant_type}
                          disabled={isPreview}
                          onChange={handleChange}
                          className="bg-white block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          label="Select here"
                          id="applicant_type"
                          name="applicant_type"
                        >
                          <option value="Institute">Institute</option>
                        </select>
                      </div>
                    </div>
                    <div className="sm:col-span-3 ">
                      <Label
                        htmlFor="course_type"
                        text="Select Course"
                        required
                      ></Label>
                      <div className="mt-2">
                        <select
                          value={formData?.course_type}
                          disabled={isPreview}
                          onChange={handleChange}
                          className="bg-white block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          label="Select here"
                          id="course_type"
                          name="course_type"
                        >
                          <option value="Nursing">Nursing</option>
                          <option value="Paramedical">Paramedical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <Label
                        htmlFor="district"
                        text="District"
                        required
                      ></Label>
                      <div className="mt-2">
                        <input
                          onChange={handleChange}
                          defaultValue={formData.district}
                          type="text"
                          placeholder="Type here"
                          disabled={true}
                          id="district"
                          name="district"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <Label htmlFor="address" text="Address" required></Label>
                      <div className="mt-2">
                        <input
                          onChange={handleChange}
                          defaultValue={formData.address}
                          type="text"
                          placeholder="Type here"
                          disabled={true}
                          id="address"
                          name="address"
                          className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row justify-end h-1/2 my-auto mb-0 gap-4">
                  <button
                    className="bg-gray-50 px-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   // onClick={goBack}
                   onClick={() => {
                    setIsPreview(true);
                    navigate(APPLICANT_ROUTE_MAP.dashboardModule.my_applications);
                  }}
                  >
                    Cancel
                  </button>
                  <Button
                    moreClass="px-6 text-white"
                    text={text}
                    onClick={function (e) {
                      setText("Save");
                      setIsPreview(false);
                      handleSubmit(e);
                    }}
                  ></Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
