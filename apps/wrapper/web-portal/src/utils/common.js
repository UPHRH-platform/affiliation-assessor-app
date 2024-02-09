import Cookies from "js-cookie";

export const setCookie = (cname, cvalue) => {
  try {
    Cookies.set(cname, JSON.stringify(cvalue));
  } catch (error) {
    return false;
  }
};

export const getCookie = (cname) => {
  try {
    let cookie = Cookies.get(cname);
    if (cookie) return JSON.parse(cookie);
    // console.log('cookievalue', cookie)
  } catch (error) {
    return false;
  }
};

export const removeCookie = (cname) => {
  try {
    Cookies.remove(cname);
    return true;
  } catch (error) {
    return false;
  }
};

export const getInitials = (name) => {
  if(!name)return(
    <></>
  );
  const names = name.split(" ");

  const firstInitial = names[0].charAt(0).toUpperCase();
  let lastInitial = "";
  if (names.length > 1) {
    lastInitial = names[1].charAt(0).toUpperCase();
  }
  return firstInitial + lastInitial;
};

export const readableDate = (dateStr) => {
  const date = new Date(dateStr);
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return (
    date.getDate() + "-" + month[date.getMonth()] + "-" + date.getFullYear()
  );
};

export const formatDate = (date) => {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join('-');
}

export const getFieldName = (formName) => {
  if(formName) {
    formName = formName.substr(formName.lastIndexOf('-') + 1);
    let splitValues = formName.split('_');
    const capitalizedStr = splitValues[0].charAt(0).toUpperCase() + splitValues[0].substr(1, splitValues.substr);
    splitValues[0] = capitalizedStr;
    return splitValues.join(' ');
  }
}

export const getLocalTimeInISOFormat = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now - offset * 60 * 1000);
  return localTime.toISOString();
}
