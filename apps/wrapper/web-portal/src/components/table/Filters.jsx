import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { formatDate, readableDate } from "../../utils/common";
import { Option, Select } from "@material-tailwind/react";
import { UP_DISTRICTS } from "../../utils/constants";
//Manage Users
export const ManageUsersFilters = ({
  filterApiCall,
  paginationInfo,
  setIsFilterOpen,
  setPaginationInfo,
}) => {
  const [filters, setFilters] = useState({
    assessorCondition: {},
    regulatorCondition: {},
  });
  const [state, setState] = useState({
    role: null,
    workingstatus: null,
  });
  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (value === "") {
      delete filters?.assessorCondition[name];
      return;
    }
    setFilters({
      assessorCondition: {
        ...filters.assessorCondition,
        [name]: {
          _eq: value,
        },
      },
      regulatorCondition: {},
    });
    setIsFilterOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };
  const handleClearFilter = () => {
    setState({
      role: null,
      workingstatus: null,
    });
    setFilters({ assessorCondition: {}, regulatorCondition: {} });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };
  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit]);
  return (
    <div className="flex flex-grow text-gray-700 z-10 dark:text-gray-400 gap-8">
      {/* <div className="flex">
        <Select
          name="role"
          id="role"
          value={state.role}
          onChange={(value) => handleChange("role", value)}
          label="Role"
          className="bg-gray-50"
        >
          <Option value="Assessor">Assessor</Option>
          <Option value="Assessor-Medical">Assessor-Medical</Option>
        </Select>
      </div> */}
      <div className="flex">
        <Select
          name="workingstatus"
          id="workingstatus"
          label="Account Status"
          value={state.workingstatus}
          onChange={(value) => handleChange("workingstatus", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Account Status</Option> */}
          <Option value="Valid">Active</Option>
          <Option value="Invalid">Inactive</Option>
        </Select>
      </div>
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

//Manage Forms
export const ManageFormsFilters = ({
  filterApiCall,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
}) => {
  const [filters, setFilters] = useState({ condition: {} });
  const [state, setState] = useState({
    application_type: null,
    round: null,
    course_type: null,
    course_level: null,
  });
  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (value === "") {
      delete filters?.condition[name];
      return;
    }
    setFilters({
      condition: {
        ...filters.condition,
        [name]: {
          _eq: value,
        },
      },
    });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleClearFilter = () => {
    setState({
      application_type: null,
      round: null,
      course_type: null,
    });
    setFilters({ condition: {} });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit]);

  return (
    <div className="flex flex-grow text-gray-700 dark:text-gray-400 gap-8">
      <div className="flex">
        <Select
          name="application_type"
          id="application_type"
          label="Application Type"
          value={state.application_type}
          onChange={(value) => handleChange("application_type", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Application Type</Option> */}
          <Option value="new_institute">New Institute</Option>
          <Option value="new_course">New Course</Option>
          <Option value="seat_enhancement">Seat Enhancement</Option>
        </Select>
      </div>
      <div className="flex">
        <Select
          name="round"
          id="round"
          label="Round No."
          value={state.round}
          onChange={(value) => handleChange("round", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Round No.</Option> */}
          <Option value={1}>Round 1</Option>
          <Option value={2}>Round 2</Option>
        </Select>
      </div>
      <div className="flex">
        <Select
          name="course_type"
          id="course_type"
          label="Course Type"
          value={state.course_type}
          onChange={(value) => handleChange("course_type", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Course Type</Option> */}
          <Option value="Nursing">Nursing</Option>
          <Option value="Paramedical">Paramedical</Option>
        </Select>
      </div>
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// Desktop Analysis
export const DesktopAnalysisFilters = ({
  filterApiCall,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
  selectedRound,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [buttonText, setButtonText] = useState("Date");
  const [filters, setFilters] = useState({
    condition: {
      assessor_id: { _is_null: true },
    },
  });
  const [state, setState] = useState({
    application_type: null,
    course_type: null,
    submitted_on: null,
    review_status: null,
  });

  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (value === "") {
      delete filters?.condition[name];
      return;
    }
    if (name === "course_type" || name === "application_type" || name === "course_level") {
      setFilters({
        condition: {
          ...filters.condition,
          course: {
            ...filters.condition.course,
            [name]: {
              _eq: value,
            },
          },
        },
      });
    } else {
      setFilters({
        condition: {
          ...filters.condition,
          [name]: {
            _eq: value,
          },
        },
      });
    }

    setIsFilterOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleDateSelect = (date) => {
    setButtonText(formatDate(date));
    setShowCalendar(false);
    setFilters({
      condition: {
        ...filters.condition,
        submitted_on: {
          _eq: formatDate(date),
        },
      },
    });
    setIsFilterOpen(date ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleClearFilter = () => {
    setState({
      application_type: null,
      course_type: null,
      submitted_on: null,
      review_status: null,
    });
    setButtonText("Date");
    setFilters({
      condition: {
        assessor_id: { _is_null: true },
      },
    });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit, selectedRound]);

  return (
    <div className="flex flex-grow text-gray-700 dark:text-gray-400 gap-8">
      <div className="flex">
        <Select
          name="application_type"
          id="application_type"
          label="Application Type"
          value={state.application_type}
          onChange={(value) => handleChange("application_type", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Application Type</Option> */}
          <Option value="new_institute">New Institute</Option>
          <Option value="new_course">New Course</Option>
          <Option value="seat_enhancement">Seat Enhancement</Option>
        </Select>
      </div>
      <div className="flex">
        <Select
          name="course_type"
          id="course_type"
          label="Course Type"
          value={state.course_type}
          onChange={(value) => handleChange("course_type", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Course Name</Option> */}
          <Option value="Nursing">Nursing</Option>
          <Option value="Paramedical">Paramedical</Option>
        </Select>
      </div>
      <div className="flex">
        <Select
          name="course_level"
          id="course_level"
          label="Course Level"
          value={state.course_level}
          onChange={(value) => handleChange("course_level", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">Course Name</Option> */}
          <Option value="Degree">Degree</Option>
          <Option value="Diploma">Diploma</Option>
        </Select>
      </div>
      <div className="flex">
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 px-8"
          onClick={() => setShowCalendar(true)}
        >
          {buttonText.includes("Date") ? buttonText : readableDate(buttonText)}
        </button>
        {showCalendar && (
          <Calendar value={state.submitted_on} onChange={handleDateSelect} />
        )}
      </div>
      {/* <div className="flex">
        <Select
          name="review_status"
          id="review_status"
          label="Review Status"
          value={state.review_status}
          onChange={(value) => handleChange("review_status", value)}
          className="bg-gray-50"
        >
          <Option value="">--Select Review Status--</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Reviewed">Reviewed</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      </div> */}
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// On-Ground Inspection Analysis
export const OnGroundInspectionFilters = ({
  filterApiCall,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
  selectedRound,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [buttonText, setButtonText] = useState("Date");
  const [filters, setFilters] = useState({ condition: {} });
  const [state, setState] = useState({
    role: null,
    submitted_on: null,
    review_status: null,
  });
  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (value === "") {
      delete filters?.condition[name];
      return;
    }
    setFilters({
      condition: {
        ...filters.condition,
        [name]: {
          _eq: value,
        },
      },
    });
    setIsFilterOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleDateSelect = (date) => {
    setButtonText(formatDate(date));
    setShowCalendar(false);
    setFilters({
      condition: {
        ...filters.condition,
        submitted_on: {
          _eq: formatDate(date),
        },
      },
    });
  };

  const handleClearFilter = () => {
    setState({
      role: null,
      submitted_on: null,
      review_status: null,
    });
    setButtonText("Date");
    setFilters({ condition: {} });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit, selectedRound]);

  return (
    <div className="flex flex-grow text-gray-700 dark:text-gray-400 gap-8">
      {/* <div className="flex">
        <Select
          name="role"
          id="role"
          value={state.role}
          onChange={(value) => {
            console.log(value);
          }}
          label="Assessor"
          className="bg-gray-50"
        >
          <Option value="">--Select Assessor--</Option>
          <Option value="admin">Admin</Option>
          <Option value="applicant">Applicant</Option>
        </Select>
      </div> */}
      <div className="flex">
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-8 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={() => setShowCalendar(true)}
        >
          {buttonText.includes("Date") ? buttonText : readableDate(buttonText)}
        </button>
        {showCalendar && (
          <Calendar value={state.submitted_on} onChange={handleDateSelect} />
        )}
      </div>
      {/* <div className="flex">
        <Select
          name="review_status"
          id="review_status"
          label="Review Status"
          value={state.review_status}
          onChange={(value) => handleChange("review_status", value)}
          className="bg-gray-50"
        >
          <Option value="">--Select Review Status--</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Reviewed">Reviewed</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      </div> */}
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// Schedule Management
export const ScheduleManagementFilters = ({
  filterApiCall,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [buttonText, setButtonText] = useState("Assessment Date");
  const [filters, setFilters] = useState({ condition: {} });
  const [state, setState] = useState({
    district: null,
    submitted_on: null,
    status: null,
  });

  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (value === "") {
      delete filters?.condition[name];
      return;
    }
    if (name === "district") {
      setFilters({
        condition: {
          ...filters.condition,
          institute: {
            [name]: {
              _eq: value,
            },
          },
        },
      });
    } else {
      setFilters({
        condition: {
          ...filters.condition,
          [name]: {
            _eq: value,
          },
        },
      });
    }
    setIsFilterOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleDateSelect = (date) => {
    setButtonText(formatDate(date));
    setShowCalendar(false);
    setFilters({
      condition: {
        ...filters.condition,
        date: {
          _eq: formatDate(date),
        },
      },
    });
    setIsFilterOpen(date ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleClearFilter = () => {
    setState({
      district: null,
      submitted_on: null,
      status: null,
    });
    setButtonText("Assessment Date");
    setFilters({ condition: {} });
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit]);

  return (
    <div className="flex flex-grow text-gray-700 dark:text-gray-400 gap-8">
      <div className="flex">
        <Select
          name="district"
          id="district"
          label="District"
          value={state.district}
          onChange={(value) => handleChange("district", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">--Select District--</Option> */}
          {UP_DISTRICTS.map((item) => (
            <Option value={item}>{item}</Option>
          ))}
        </Select>
      </div>
      <div className="flex">
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-8 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={() => setShowCalendar(true)}
        >
          {buttonText.includes("Assessment")
            ? buttonText
            : readableDate(buttonText)}
        </button>
        {showCalendar && (
          <Calendar value={state.submitted_on} onChange={handleDateSelect} />
        )}
      </div>
      <div className="flex">
        <Select
          name="status"
          id="status"
          label="Status"
          value={state.status}
          onChange={(value) => handleChange("status", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">--Select Status--</Option> */}
          <Option value="OGA Completed">Completed</Option>
          <Option value="Upcoming">Upcoming</Option>
          <Option value="Inspection Delayed">Delayed</Option>
        </Select>
      </div>
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};


// Dashboard
export const DashboardFilters = ({
  selectedRound,
  filterApiCall,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [buttonText, setButtonText] = useState("Date");
  const [filters, setFilters] = useState(null);
  const [state, setState] = useState({
    selectedRound:0,
    district: null,
    startDate: null,
    endDate:null,
    status: null,
  });
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);


  const handleChange = (name, value) => {
    console.log(name)

    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "district") {
      setFilters((prevState) => ({
        ...prevState,
        "district": value
      }));
    } else{
      setFilters((prevState) => ({
        ...prevState,
        "status": value
      }));
    }
    console.log(filters)
    setIsFilterOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleClearFilter = () => {
    setState({
    district: null,
    startDate: null,
    endDate:null,
    status: null
    });
    setButtonText("Date");
    setDateRange([new Date(), new Date()])
    setFilters('cleared');
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  const handleDateChange = (date) => {
    console.log(date)
   // console.log(round)
    setDateRange([date, date]);
    setButtonText(readableDate(formatDate(date[0])) + " - " + readableDate(formatDate(date[1])));
    setShowCalendar(false);
    setState((prevState) => ({
      ...prevState,
      startDate:formatDate(date[0]),
      endDate:formatDate(date[1])
    }));
   
    setFilters((prevState) => ({
      ...prevState,
      "startDate":formatDate(date[0]),
      "endDate":formatDate(date[1])
    }));

     setIsFilterOpen(date ? true : false);
     setPaginationInfo((prevState) => ({
       ...prevState,
       offsetNo: 0,
     })); 
  };

  const handleDateRangeSelect = (date) => {
    console.log(date)
   /*  console.log(formatDate(date))
    setButtonText(formatDate(date)); */
    setShowCalendar(false);
  /*   setFilters({
      condition: {
        ...filters.condition,
        date: {
          _eq: formatDate(date),
        },
      },
    });
    setIsFilterOpen(date ? true : false); */
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));
  };

  useEffect(() => {
    filterApiCall(filters);
  }, [filters, paginationInfo.offsetNo, paginationInfo.limit]);

  return (
    <div className="flex flex-grow text-gray-700 dark:text-gray-400 gap-8">
      <div className="flex">
        <Select
          name="district"
          id="district"
          label="District"
          value={state.district}
          onChange={(value) => handleChange("district", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">--Select District--</Option> */}
          {UP_DISTRICTS.map((item) => (
            <Option value={item}>{item}</Option>
          ))}
        </Select>
      </div>
      <div className="flex">
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-8 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={() =>{
            setShowCalendar(true);
            setDateRange([new Date(), new Date()]);
          } }
        >
          {buttonText.includes("Date")
            ? "Date"
            : buttonText}
        </button>
        {showCalendar && (
          <Calendar
            onChange={handleDateChange}
            selectRange
            value={dateRange}
            tileContent={({ date, view }) => {
              if (view === 'month' && date >= dateRange[0] && date <= dateRange[1]) {
                return <div className="selected-range"></div>;
              }
              return null;
            }}
            onRangeChange={handleDateRangeSelect}
          />
        )}
      </div>



      <div className="flex">
        <Select
          name="status"
          id="status"
          label="Status"
          value={state.value}
          onChange={(value) => handleChange("status", value)}
          className="bg-gray-50"
        >
          {/* <Option value="">--Select Status--</Option> */}
          <Option value="Approved">Approved</Option>
          <Option value="Rejected">Rejected</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="OGA Completed">OGA Completed</Option>
          <Option value="DA Completed">DA Completed</Option>
          <Option value="Inspection Scheduled">Inspection Scheduled</Option>
          <Option value="Inspection Delayed">Inspection Delayed</Option>
          <Option value="Application Submitted">Application Submitted</Option>
          <Option value="Resubmitted">Resubmitted</Option>
          <Option value="Returned">Returned</Option>
        </Select>
      </div>
      <div>
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onClick={handleClearFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};