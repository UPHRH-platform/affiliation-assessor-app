import React, { useContext, useEffect, useState } from "react";
import { getStatus,
  exportToExcel } from "../../api";
import { readableDate } from "../../utils/common";
import { Button } from "../../components";
import { ContextAPI } from "../../utils/ContextAPI";
import { useParams} from "react-router-dom";

function StatusLogModal({ closeStatusModal, formId }) {
  const [formStatus, setFormStatus] = useState([]);
  const { setSpinner } = useContext(ContextAPI);
  let { formName } = useParams();
  useEffect(() => {
    async function fetchData() {
      const postData = { id: formId };
      try {
        setSpinner(true);
        const res = await getStatus(postData);
        console.log("res", res);
        setFormStatus(res.events);
      } catch (error) {
        console.log(error);
      } finally {
        setSpinner(false);
      }
    }
    fetchData();
  }, []);

  const downloadStatus = () => {
    const ENKETO_URL = formName;
    const statusLogs = {
      sheetName: 'Status logs',
      downloadObject: [],
      headers: ['Event Name', 'Created Date', 'Remarks'],
    }

    if(formStatus.length > 0) {
      formStatus.forEach((element) => {
        const status = {
          event_name: element.event_name,
          created_date: readableDate(element.created_date),
          remarks: element.remarks,
        }
        statusLogs.downloadObject.push(status)
      })
    }

    const downloadObjects = {
      fileName: `status_log_${ENKETO_URL}.xlsx`,
      objectsList: [statusLogs]
    }
    exportToExcel(downloadObjects);
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center fixed inset-0 bg-opacity-25 backdrop-blur-sm z-[100]">
        <div className="flex bg-white rounded-xl shadow-xl border border-gray-400 w-[560px] h-[460px] p-8">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex text-xl font-medium">
              <h1>Status log</h1>
            </div>

            <div className={`flex flex-col overflow-auto min-h-[288px]`}>
              {formStatus.length > 0 ? (
                formStatus.map((obj) => (
                  <div
                    className="flex flex-col rounded-xl gap-1 border bg-gray-100 p-4 mb-4"
                    key={obj?.event_id}
                  >
                    <p className="font-medium">{obj?.event_name}</p>
                    <p className="text-sm">{obj?.remarks}</p>
                    <p className="text-sm text-gray-600">
                      {readableDate(obj?.created_date)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-medium">No events available</p>
              )}
            </div>
            <div className="footer flex flex-row justify-end">
              <Button
                onClick={() => {
                  downloadStatus();
                }}
                moreClass="border mr-2 boevent_namerder-blue-500 bg-white text-blue-500 w-[140px]"
                text="Download"
              ></Button>
              <Button
                onClick={() => {
                  closeStatusModal(false);
                }}
                moreClass="border boevent_namerder-blue-500 bg-white text-blue-500 w-[140px]"
                text="Close"
              ></Button>
              {/* <button onClick={() => {closeStatusModal(false)}} className="border border-blue-500 bg-white text-blue-500 w-[140px] h-[40px] font-medium rounded-[4px]">Close</button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StatusLogModal;
