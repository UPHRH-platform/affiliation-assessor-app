import { APIS } from "../constants";
import customPost from "./customPost";
import axios from 'axios';
import { utils, writeFile } from 'xlsx';

export const getFormData = async (postData) => {

  const res = await customPost.post(
    APIS.FORMS.VIEW_FORM,
    postData
  );
  return res;
};

export const base64ToPdf = async (postData) => {
  const res = await axios.post(`${process.env.REACT_APP_PDF_DOWNLOAD_URL}/convert-via-puppeteer/pdfpuppeteer`, {
    url: postData,
  });
  return res;
};

export const getLocalTimeInISOFormat = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now - offset * 60 * 1000);
  return localTime.toISOString();
}

export const registerEvent = async (postData) => {
  const events = {
    events: []
  };
  events.events.push(postData);

  const res = await customPost.post(
    APIS.COMMON.REGISTER_EVENT,
    events
  );
  return res;
}

export const getStatus = async (postData) => {
  const res = await customPost.post(
    APIS.viewStatus.getViewStatus,
    postData
  );
  return res.data;
};

//#region (xlsx)

//#region (json to xlsx)
export const exportToExcel = async (downloadObjects) => {
  if (downloadObjects && downloadObjects.objectsList) {
    const workbook = utils.book_new();
    downloadObjects.objectsList.forEach((element) => {
      const sheetName = element.sheetName ? element.sheetName : `Sheet ${workbook.SheetNames.length + 1}`
      const worksheet = utils.json_to_sheet([]);
      utils.sheet_add_aoa(worksheet, [element.headers])
      utils.book_append_sheet(workbook, worksheet, sheetName);
      utils.sheet_add_json(worksheet, element.downloadObject, { origin: 'A2', skipHeader: true });
    });
    writeFile(workbook, downloadObjects.fileName ? downloadObjects.fileName : 'data.xlsx');
  }
}

/** API to save drafted application on click of save as draft */
export const saveApplicationDraft = async (postData) => {
  const res = await customPost.put(
    APIS.FORMS.SAVE_DRAFT,
    postData
  );
  return res.data;
}

export const updateApplicationDraft = async (postData) => {
  const res = await customPost.post(
    APIS.FORMS.UPDATE_DRAFT,
    postData
  );
  return res.data;
}

export const deleteApplicationDraft = async (postData) => {
  const res = await customPost.post(
    APIS.FORMS.DELETE_DRAFT,
    postData
  );
  return res.data;
}

export const updateFormStatus = async (postData) => {
  const res = await customPost.put(APIS.FORMS.UPDATE_FORM, postData);
  return res;
};
//#endregion

//#endregion
