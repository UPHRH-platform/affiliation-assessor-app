import React, { useContext, useEffect, useState } from "react";
import FilteringTable from "../../components/table/FilteringTable";
import { Switch } from "@material-tailwind/react";

import { Link } from "react-router-dom";
import { Button } from "../../components";
import {
  createBulkUsers,
} from "../../api";
import { userService } from "../../api/userService";
import { getCookie } from "../../utils/common";
import { ContextAPI } from "../../utils/ContextAPI";

function BulkUploadUsersModal({ closeBulkUploadUsersModal, setUsersCreated }) {
  const [file, setFile] = useState();
  const { setSpinner, setToast } = useContext(ContextAPI);
  const [tableUserList, setTableUserList] = useState([]);
  const hiddenFileInput = React.useRef(null);
  const [tableDataReady, setTableDataReady] = useState(false);
  const [invalidTableUserList, setInvalidTableUserList] = useState([]);
  const [invalidUserDataFlag, setInvalidUserDataFlag] = useState(false);
  const [allUsersList, setAllUsersList] = useState([]);

  let selectedRows = [];
  const emailExp = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
  const mobNumberExp = /^(0|91)?[6-9][0-9]{9}$/;
  const isEmailValid = (email) => {
    if (
      emailExp.test(email?.trim().toString()) &&
      email?.trim().toString().length != 0
    ) {
      return email;
    } else {
      return email?.toString().length === 0 ? (
        <span className="text-red-500 mt-2 text-sm">
          - <br></br> <small>Missing Email ID</small>
        </span>
      ) : (
        <span className="text-red-500 mt-2 text-sm">
          {email} <br></br>
          <small>Invalid Email ID</small>
        </span>
      );
    }
  };

  const ismobileNumberValid = (mobileNumber) => {
    if (
      mobNumberExp.test(parseInt(mobileNumber)) &&
      mobileNumber.toString().length != 0
    ) {
      return mobileNumber;
    } else {
      return mobileNumber?.toString().length === 0 ? (
        <span className="text-red-500 mt-2 text-sm">
          - <br></br> <small>Missing mobile number</small>
        </span>
      ) : (
        <span className="text-red-500 mt-2 text-sm">
          {mobileNumber} <br></br>
          <small>Invalid mobile number</small>
        </span>
      );
    }
  };

  const isDataValid = (data) => {
    return data?.toString().length != 0 ? (
      data
    ) : (
      <span className="text-red-500 mt-2 text-sm">
        - <br></br> <small>Missing Text</small>
      </span>
    );
  };

  const COLUMNS = [
    {
      Header: "Email",
      accessor: "email",
      Cell: (props) => {
        return <div>{isEmailValid(props.value)}</div>;
      },
    },
    {
      Header: "Full Name",
      accessor: "full_name",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "First Name",
      accessor: "firstName",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "Last Name",
      accessor: "lastName",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "Mobile Number",
      accessor: "phoneNumber",
      Cell: (props) => {
        return <div>{ismobileNumberValid(props.value)}</div>;
      },
    },
    {
      Header: "Role",
      accessor: "roleName",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "code",
      accessor: "code",
      Cell: (props) => {
        return <div>{(props.value)}</div>;
      },
    },
  ];

  const handleClick = (e) => {
    hiddenFileInput.current.click();
  };

  const handleChange = (e) => {
    const fileUploaded = e.target.files[0];
    console.log(fileUploaded)

    setFile(fileUploaded.name.substring(0, fileUploaded.name.lastIndexOf(".")));
    handleFile(fileUploaded);
  };

  const handleFile = (file) => {
    const formData = new FormData();
    const fileReader = new FileReader();
    formData.append("file", file);

    if (file) {
      fileReader.onload = function (event) {
        const text = event.target.result;
        csvFileToArray(text);
      };
      fileReader.readAsText(file);
    }
  };

  const csvFileToArray = (string) => {
    let invalidUserData = [];
    const csvHeader = string.trim().slice(0, string.indexOf("\n")).split(",");
    if (!csvHeader[csvHeader.length - 1]) {
      csvHeader.pop();
    }

    const csvRows = string
      .slice(string.indexOf("\n") + 1)
      .split("\n")
      .filter((item) => item);
    const tableUserList = csvRows.map((i) => {
      const values = i.split(",");
      let obj = csvHeader.reduce((object, header, index) => {
        object[header.trim()] = values[index]?.trim()?.replace("\r", "");
        return object;
      }, {});
      obj["full_name"] = obj?.firstName + " " + obj?.lastName;
      if (
        !emailExp.test(obj?.email?.toString()) ||
        !mobNumberExp.test(obj?.phoneNumber?.toString()) ||
        obj?.firstName == "" ||
        obj?.lastName == "" ||
        obj?.email == "" ||
        obj?.phoneNumber == "" ||
        obj?.roleName == ""
      ) {
        obj["isRowInvalid"] = true;
        invalidUserData.push(obj);
      }
      if( obj?.roleName === "Assessor"  && isNaN(parseInt(obj?.code)) )
      {
        obj["isRowInvalid"] = true;
        invalidUserData.push(obj);
      }
      return obj;
    });

    setTableUserList(tableUserList);
    setAllUsersList(tableUserList); // setting the all user list again to use it in on toggle
    setInvalidTableUserList(invalidUserData);
    setTableDataReady(true);
  };

  const handleToggleChange = (e) => {
    setInvalidUserDataFlag(!invalidUserDataFlag);
  };

  const createUsers = async () => {

    try {
      setSpinner(true);
      const updatedReqBody = []
      //const emailID = getCookie("userData")?.email;
      tableUserList.forEach((user) => {
        updatedReqBody.push(
          {
            username: user.email,
            password: user.phoneNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roleName: user.roleName,
            phoneNumber:  user.phoneNumber,
            code:  user.code
          }
        )
      })
      const postDataKeyCloak = {
        userCreationList: updatedReqBody,
        email: getCookie("userData")?.email
      }
      const keycloakRes = await createBulkUsers(postDataKeyCloak);
      //keycloak API call
      if (keycloakRes?.data) {
          setToast((prevState) => ({
            ...prevState,
            toastOpen: true,
            toastMsg: "User(s) creation request aknowledged. You would be intimidated via email",
            toastType: "success",
          }));
          closeBulkUploadUsersModal(false);
      }
  
     
    } catch (error) {
      console.log(error)
      const errorMessage = JSON.parse(error?.config?.data).regulators[0]?.user_id?.errorMessage || "Something went wrong. Please try again later."
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

  const isFileValid = () => {
    let flag = true;
    COLUMNS.forEach((item) => {
      if (tableUserList.length) {
        if (!Object.keys(tableUserList[0])?.includes(item.accessor)) {
          flag = false;
          return;
        }
      } else {
        flag = false;
      }
    });
    return flag;
  };

  const setSelectedRows = (rowList) => {
    selectedRows = [...rowList].filter((item) => !item.original.isRowInvalid);
    if (selectedRows.length) {
      document.getElementById("schedule-bulk-assessment").disabled = false;
    } else {
      document.getElementById("schedule-bulk-assessment").disabled = true;
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center absolute inset-0 bg-opacity-25 backdrop-blur-sm z-[100]">
        <div className="flex bg-white rounded-xl shadow-xl border border-gray-400 w-[960px] h-[560px] p-6">
          <div className="flex flex-col justify-between w-full">
            <div className="flex text-xl font-semibold">
              <h1>Bulk upload users</h1>

              <div className="flex flex-row m-auto">
                {tableUserList.length !== 0 && isFileValid() && (
                  <Switch
                    id="show-with-errors"
                    label={<span className="text-sm">Show with errors</span>}
                    onChange={handleToggleChange}
                  />
                )}
              </div>

              <div className=" flex-row text-blue-500">
                <Link
                  to="/files/Template_bulk_user_create.csv"
                  target="_blank"
                  download
                >
                  <small>Download Template</small>
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              {(!tableDataReady || (tableDataReady && !isFileValid())) && (
                <div className="flex flex-row m-auto">
                  <input
                    type={"file"}
                    accept={".csv"}
                    ref={hiddenFileInput}
                    style={{ display: "none" }}
                    onChange={handleChange}
                  />

                  <Button
                    moreClass="text-white w-full px-6"
                    text="Browse file to upload"
                    onClick={handleClick}
                  />
                </div>
              )}
              {tableDataReady && !isFileValid() && (
                <div className="text-xl flex-row text-blue-500 text-center">
                  Please upload csv file with supported data format. Kindly
                  refer the template!
                </div>
              )}
              {tableDataReady && isFileValid() && (
                <div className="items-center">
                  <div className="text-2xl w-full font-medium">
                    <FilteringTable
                      moreHeight="h-[300px]"
                      pagination={false}
                      dataList={
                        invalidUserDataFlag
                          ? invalidTableUserList
                          : tableUserList
                      }
                      columns={COLUMNS}
                      navigateFunc={() => {}}
                      showCheckbox={true}
                      showFilter={false}
                      showSearch={false}
                      // rows = {rows}
                      setSelectedRows={setSelectedRows}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <hr />
              <div className="footer flex flex-row gap-4 justify-end">
                <Button
                  onClick={() => {
                    closeBulkUploadUsersModal(false);
                  }}
                  moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                  text="Cancel"
                ></Button>

                {tableDataReady && (
                  <Button
                    id="schedule-bulk-assessment"
                    onClick={() => {
                      createUsers();
                    }}
                    moreClass="border text-white w-[120px]"
                    text="Create users"
                  ></Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BulkUploadUsersModal;
