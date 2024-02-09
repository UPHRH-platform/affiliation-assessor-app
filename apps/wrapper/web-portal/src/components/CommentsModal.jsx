import React, { useEffect, useState } from 'react';
import { Button } from "../components";
import { FaEye } from "react-icons/fa";
import {
    fetchAllComments,
} from "../api";

import { getCookie } from "../utils/common";
import { readableDate, formatDate, getInitials } from "../utils";
import { Tooltip } from "@material-tailwind/react";


function CommentsModal({ showAlert, actionFunction, quesContent, actionButtonLabel, alertMsg, actionProps }) {

    const [showCommentsSection, setShowCommentsSection] = useState(false);
    const hiddenFileInput = React.useRef(null);
    const [fileTypeError, setFileTypeError] = useState(false);
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState({});

    const [daComments, setDaComments] = useState('');
    const [adminComments, setAdminComments] = useState('');
    const [ogaComments, setOgaComments] = useState('');

    // isDATextAreaDisabled
    const [isDATextAreaDisabled, setIsDATextAreaDisabled] = useState(true);
    const [isAdminTextAreaDisabled, setIsAdminTextAreaDisabled] = useState(true);
    const [isOGATextAreaDisabled, setIsOGATextAreaDisabled] = useState(true);


    const [items, setItems] = useState([]);
    const [loggedInRole, setLoggedInRole] = useState('');


    const setApproveReject = (e) => {
        console.log("00000000000", e)
        e === "Approved" ? setShowCommentsSection(false) : setShowCommentsSection(true)
    };

    const handleChangeDAComments = (e) => {
        setDaComments(e.target.value)
    };

    const handleChangeAdminComments = (e) => {
        setAdminComments(e.target.value)
    };

    const handleChangeOGAComments = (e) => {
        setOgaComments(e.target.value)
    };

    const handleButtonClick = (e) => {
        hiddenFileInput.current.click();
    };

    const handleChangeFileUpload = (e) => {
        const fileUploaded = e.target.files[0];
        if (!fileUploaded.name.includes(".pdf") || fileUploaded.size > 5000000) {
            setFileTypeError(true);
        } else {
            setFileName(
                fileUploaded?.name.substring(0, fileUploaded.name.lastIndexOf("."))
            );
            setFileTypeError(false);
            setFile(fileUploaded);
        }
    };

    const handleFile = (uploadFile) => {
        const formData = {
            file: uploadFile,
            quesNumber: 1,
        };

        //  getNocOrCertificatePdf(formData);
    };



    const getAllComments = async () => {
        try {
            const res = await fetchAllComments();
            console.log(res?.comments)

            setItems(res?.comments)
            /*    let commentsByRole = res?.comments.reduce((acc, el) => {
                   const key = el?.commentData?.commentSource?.role;
                   (acc[key] = acc[key] || []).push(el.commentData.comment);
                   return acc;
               }, {});
   
               setAdminComments(commentsByRole.Admin.join('\r\n'))
               setOgaComments(commentsByRole["Assessor"].join('\r\n'))
               setDaComments(commentsByRole["Desktop-Admin"].join('\r\n')) */
        } catch (error) {
            console.log("getAllComments failed ...", error)
        }

        // getNocOrCertificatePdf(formData);
    };

    useEffect(() => {
        getAllComments()
        //const loggedInRole = getCookie("userData")?.attributes.Role[0];
        setLoggedInRole(getCookie("userData")?.attributes.Role[0])
    }, []);


    return (
        <>
            <div className='flex justify-center items-center fixed inset-0 bg-opacity-25 z-10 backdrop-blur-sm '>
                <div className='overflow container mx-auto flex px-3  justify-between p-4 rounded-xl shadow-xl border border-gray-400 bg-white max-h-[calc(100vh-90px)] max-w-[600px]  '>
                    <div className='flex flex-col gap-4 min-w-[400px]'>
                        <span>{quesContent}</span>

                        <div className='min-w-[550px]'>

                            {items.map((item, index) => (

                                <p className='m-3 mb-2 p-2 border border-grey-500 text-black font-medium rounded-[4px]'>

                                    <div className='flex flex-row gap-4 '>
                                        <Tooltip arrow content={item.commentData.commentSource.role}>
                                            <div className='flex h-[40px] w-[40px] rounded-full bg-pink-500 items-center m-2 justify-center'>
                                                {getInitials(
                                                    `${item.commentData.commentSource.role.trim()}`
                                                )}
                                            </div>
                                        </Tooltip>

                                        <div className='flex flex-col'>
                                            <div className='flex  m-1'>
                                                <div>{item.commentData.commentSource.userName}</div>
                                                <div className='ml-4 text-gray-700'>{readableDate(item.createdDate)}</div>
                                            </div>
                                            <div className='flex w-[430px] justify-between'>
                                                <div className=''>
                                                    <p >{item.commentData.comment}</p>
                                                </div>
                                                <div >
                                                    <span className='flex flex-row gap-1 items-center cursor-pointer'><FaEye />{item.commentData.file}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </p>

                            ))}


                            {loggedInRole === "Assessor" &&
                                <div>
                                    <input className='justify-center'
                                        type="file"
                                        accept="application/pdf, .pdf"
                                        ref={hiddenFileInput}
                                        onChange={handleChangeFileUpload}
                                        style={{ display: "none" }}
                                    />


                                    <div className=' flex gap-4 justify-center '>
                                        <Button
                                            moreClass="text-white flex justify-center h-fit w-2/3 px-6"
                                            text="Browse file to upload(.pdf)"
                                            onClick={handleButtonClick}
                                        />{" "}
                                        <br />

                                    </div>
                                    {fileTypeError && (
                                        <div className=' flex gap-4 justify-center '>
                                            <div className="text-red-500">
                                                {"Only pdf files accepted  ( max size 5MB )"}
                                            </div>
                                        </div>

                                    )}

                                    <div className=' flex gap-4 justify-center '>
                                        <button
                                            onClick={() => {
                                                setFileName(""); setFile({})
                                            }}
                                            className="border border-blue-900 bg-white text-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleFile(file)}
                                            disabled={fileName && !fileTypeError ? false : true}
                                            // className="border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                            className={`${fileName && !fileTypeError
                                                ? "border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                                : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 font-medium rounded-[4px] w-[140px]"
                                                }`}
                                        >
                                            {"Upload Proof"}
                                        </button>
                                    </div>

                                    <div className="mt-2 flex ml-2">{fileName}</div>
                                </div>
                            }

                            <textarea
                                onChange={handleChangeDAComments}
                                placeholder="Write here..."
                                className="mt-2 ml-2 border w-[530px] h-[100px] p-2 rounded-xl resize-none"
                                value={daComments}
                                cols="30"
                                rows="4"
                            ></textarea>

                            {loggedInRole === "Desktop-Admin" &&
                                <div
                                    onChange={(e) => setApproveReject(e.target.value)}
                                    className="py-2 px-1 ml-2 mt-2"
                                >
                                    <input type="radio"
                                        value="Approved" name="OGAResponse" /> Approve
                                    <input
                                        type="radio"
                                        value="Rejected"
                                        name="OGAResponse"
                                        className="ml-5"
                                    />{" "} Reject
                                </div>}
                        </div>

                        <div className='min-w-[550px]'>

                            {items.map((item, index) => (

                                <p className='m-3 mb-2 p-2 border border-grey-500 text-white font-medium rounded-[4px]'>

                                    <div className='flex flex-row gap-4 '>
                                        <Tooltip arrow content={item.commentData.commentSource.role}>
                                            <div className='flex h-[40px] w-[40px] rounded-full bg-pink-500 items-center m-2 justify-center'>
                                                {getInitials(
                                                    `${item.commentData.commentSource.role.trim()}`
                                                )}
                                            </div>
                                        </Tooltip>

                                        <div className='flex flex-col'>
                                            <div className='flex  m-1'>
                                                <div>{item.commentData.commentSource.userName}</div>
                                                <div className='ml-4 text-gray-700'>{readableDate(item.createdDate)}</div>
                                            </div>
                                            <div className='flex w-[430px] justify-between'>
                                                <div className=''>
                                                    <p >{item.commentData.comment}</p>
                                                </div>
                                                <div >
                                                    <span className='flex flex-row gap-1 items-center cursor-pointer'><FaEye />{item.commentData.file}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </p>

                            ))}


                          

                            <textarea
                                onChange={handleChangeDAComments}
                                placeholder="Write here..."
                                className="mt-2 ml-2 border w-[530px] h-[100px] p-2 rounded-xl resize-none"
                                value={daComments}
                                cols="30"
                                rows="4"
                            ></textarea>

{
                                <div>
                                    <input className='justify-center'
                                        type="file"
                                        accept="application/pdf, .pdf"
                                        ref={hiddenFileInput}
                                        onChange={handleChangeFileUpload}
                                        style={{ display: "none" }}
                                    />


                                    <div className=' flex gap-4 justify-center m-4'>
                                        <Button
                                            moreClass="text-white flex justify-center h-fit w-2/3 px-6"
                                            text="Browse file to upload(.pdf)"
                                            onClick={handleButtonClick}
                                        />{" "}
                                        <br />

                                    </div>
                                    {fileTypeError && (
                                        <div className=' flex gap-4 justify-center '>
                                            <div className="text-red-500">
                                                {"Only pdf files accepted  ( max size 5MB )"}
                                            </div>
                                        </div>

                                    )}

                                    <div className=' flex gap-4 justify-center '>
                                        <button
                                            onClick={() => {
                                                setFileName(""); setFile({})
                                            }}
                                            className="border border-blue-900 bg-white text-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleFile(file)}
                                            disabled={fileName && !fileTypeError ? false : true}
                                            // className="border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                            className={`${fileName && !fileTypeError
                                                ? "border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                                : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 font-medium rounded-[4px] w-[140px]"
                                                }`}
                                        >
                                            {"Upload Proof"}
                                        </button>
                                    </div>

                                    <div className="mt-2 flex ml-2">{fileName}</div>
                                </div>
                            }

                        </div>

                        <div className='mt-2 footer flex flex-row justify-between mb-2'>
                            <button onClick={() => { showAlert(false) }} className="border border-blue-500 bg-white text-blue-500 w-[140px] h-[40px] font-medium rounded-[4px]">Cancel</button>
                            <button onClick={() => actionFunction(actionProps)} className={`border  w-[140px] h-[40px] font-medium rounded-[4px] ${actionButtonLabel === "Delete" ? "border-red-800 text-white bg-red-800" : "border-blue-500 text-white bg-blue-500"}`}>{actionButtonLabel}</button>
                        </div>
                    </div>
                </div>
            </div>









            {/* overflow:scroll reqd */}          {/*   <div className='flex justify-center items-center fixed inset-0 bg-opacity-25 z-10 backdrop-blur-sm '>
                <div className='container mx-auto flex px-3  justify-between p-4 rounded-xl shadow-xl border border-gray-400 bg-white min-h-[calc(100vh-90px)] max-w-[600px]  '>
                    <div className='flex flex-col gap-4 min-w-[400px]'>
                        <span>{quesContent}</span>
                        <div>
                            <div className='col-span-2 title flex font-bold'>
                                <h1>DA Comments  </h1>
                            </div>
                            <textarea
                                onChange={handleChangeDAComments}
                                placeholder="Write here"
                                className="ml-2 border w-[520px] h-[100px] p-2 rounded-xl resize-none"
                                disabled={isDATextAreaDisabled}
                                value={daComments} 
                                cols="30"
                                rows="4"
                            ></textarea>
                        </div>
                        <hr />
                        <div>
                            <div className='col-span-2 title flex font-bold'>
                                <h1>Admin Comments</h1>
                            </div>
                            <textarea
                                onChange={handleChangeAdminComments}
                                placeholder="Write here"
                                disabled={isAdminTextAreaDisabled}
                                className="ml-1 border w-[520px] h-[100px] p-2 rounded-xl resize-none"
                                value={adminComments} 
                                cols="30"
                                rows="4"
                            ></textarea>

                        </div>

                        <hr />
                        <div className='col-span-2 title flex font-bold'>
                                <h1>OGA Observations</h1>
                            </div>
                        {<div
                            onChange={(e) => setApproveReject(e.target.value)}
                            className="py-2 px-1"
                        >
                            <input type="radio"
                                value="Approved" name="OGAResponse" /> Approve
                            <input
                                type="radio"
                                value="Rejected"
                                name="OGAResponse"
                                className="ml-5"
                            />{" "} Reject
                        </div>}


                        <input className='justify-center'
                            type="file"
                            accept="application/pdf, .pdf"
                            ref={hiddenFileInput}
                            onChange={handleChangeFileUpload}
                            style={{ display: "none" }}
                        />
                     

                        <div className=' flex gap-4 justify-center '>
                            <Button
                                moreClass="text-white flex justify-center h-fit w-2/3 px-6"
                                text="Browse file to upload(.pdf)"
                                onClick={handleButtonClick}
                            />{" "}
                            <br />

                        </div>
                        {fileTypeError && (
                            <div className=' flex gap-4 justify-center '>
                                <div className="text-red-500">
                                    {"Only pdf files accepted  ( max size 5MB )"}
                                </div>
                            </div>

                        )}

                        <div className=' flex gap-4 justify-center '>
                            <button
                                onClick={() => {
                                    setFileName("");setFile({})
                                }}
                                className="border border-blue-900 bg-white text-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleFile(file)}
                                disabled={fileName && !fileTypeError ? false : true}
                                // className="border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                className={`${fileName && !fileTypeError
                                    ? "border border-blue-900 text-white bg-blue-900 w-[140px] h-[40px] font-medium rounded-[4px]"
                                    : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 font-medium rounded-[4px] w-[140px]"
                                    }`}
                            >
                                {"Upload Proof"}
                            </button>
                        </div>

                        <div className="mt-2 flex ml-2">{fileName}</div>

                        {showCommentsSection &&
                            <div>
                                <div className='title flex font-bold'>
                                    <h1>OGA
                                        Comments</h1>
                                </div>
                                <div className='body flex justify-center'>
                                 <div className="body">
                                        <textarea
                                            disabled={isOGATextAreaDisabled}
                                            onChange={handleChangeOGAComments}
                                            placeholder="Write here"
                                            className="ml-2 border w-[520px] h-[100px] p-2 rounded-xl resize-none"
                                            value={ogaComments} 
                                            cols="30"
                                            rows="8"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        }
                        <hr />
                        <div className='footer flex flex-row justify-between'>
                            <button onClick={() => { showAlert(false) }} className="border border-blue-500 bg-white text-blue-500 w-[140px] h-[40px] font-medium rounded-[4px]">Cancel</button>
                            <button onClick={() => actionFunction(actionProps)} className={`border  w-[140px] h-[40px] font-medium rounded-[4px] ${actionButtonLabel === "Delete" ? "border-red-800 text-white bg-red-800" : "border-blue-500 text-white bg-blue-500"}`}>{actionButtonLabel}</button>
                        </div>
                    </div>
                </div>
            </div> */}
        </>
    )
}

export default CommentsModal
