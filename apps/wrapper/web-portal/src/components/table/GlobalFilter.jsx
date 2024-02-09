import React, { useEffect, useState } from "react";
import { useAsyncDebounce } from "react-table";
import { MdFilterList } from "react-icons/md";
import { useLocation } from "react-router-dom";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import {
  DesktopAnalysisFilters,
  ManageFormsFilters,
  ManageUsersFilters,
  OnGroundInspectionFilters,
  ScheduleManagementFilters,
  DashboardFilters
} from "./Filters";
import { searchUsers } from "../../api";

const GlobalFilter = ({
  filter,
  setFilter,
  filterApiCall,
  searchApiCall,
  setIsSearchOpen,
  setIsFilterOpen,
  paginationInfo,
  setPaginationInfo,
  selectedRound,
  showFilter,
  showSearch,
}) => {
  const [value, setValue] = useState("");
  const [isFilter, setIsFilter] = useState(false);
  let location = useLocation();

  const handleSearch = async (value) => {
    setValue(value);
    setIsSearchOpen(value ? true : false);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: 0,
    }));

    // comment following to implement debounce
    const postData = { searchString: `%${value}%` };
    if (value.trim() == "" || value.trim().length >= 3) {
      await searchApiCall(postData);
    }

    {
      /** rxjs debounce implementation */
    }
    // if (value.trim()=="") {
    //   return await searchApiCall(postData);
    // }
    // fromEvent(document.getElementById("global_search_input"), "keyup")
    //   .pipe(
    //     map((e) => {
    //       return e.target.value.trim();
    //     }),
    //     filter((res) => res.length >= 3),
    //     debounceTime(750),
    //     distinctUntilChanged()
    //   )
    //   .subscribe(async(value) => {
    //     console.log(value);
    //     const postData = { searchString: `%${value}%` };
    //     await searchApiCall(postData);
    //   });
  };

  useEffect(() => {
    (async () => {
      if (value !== "") {
        await searchApiCall({ searchString: `%${value}%` });
      }
    })();
  }, [paginationInfo.offsetNo, paginationInfo.limit, selectedRound]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        {showSearch && (
          <div className="bg-white flex w-1/4 items-stretch">
            <input
              id="global_search_input"
              value={value || ""}
              onChange={(e) => {
                // setValue(e.target.value);
                handleSearch(e.target.value);
              }}
              type="search"
              className="block w-[1px] min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-transparent bg-clip-padding p-2  text-base font-normal leading-[1.6] text-neutral-700 outline-none transition duration-200 ease-in-out focus:z-[3] focus:border-primary focus:text-neutral-700 focus:shadow-[inset_0_0_0_1px_rgb(59,113,202)] focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:placeholder:text-neutral-200 dark:focus:border-primary"
              placeholder={location.pathname===ADMIN_ROUTE_MAP.adminModule.certificateManagement.home?"Search Institute (min 3 characters)":"Search (min 3 characters required)"}
            />
          </div>
        )}
        {showFilter && (
          <div className="flex justify-end">
            <div
              className="flex flex-row gap-2 cursor-pointer items-center"
              onClick={() => {
                setIsFilter(!isFilter);
                setIsFilterOpen(!isFilter);
              }}
            >
              <MdFilterList className="text-gray-500" />
              <h6 className="text-base text-gray-500 font-semibold">Filter</h6>
            </div>
          </div>
        )}
      </div>
      {isFilter && (
        <div>
          {(() => {
            switch (location.pathname) {
              //Manage Users
              case ADMIN_ROUTE_MAP.adminModule.manageUsers.home:
                return (
                  <ManageUsersFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                  />
                );
              //Manage Forms
              case ADMIN_ROUTE_MAP.adminModule.manageForms.home:
                return (
                  <ManageFormsFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                  />
                );
              //Desktop Analysis
              case ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home:
                return (
                  <DesktopAnalysisFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                    selectedRound={selectedRound}
                  />
                );
              //On-Ground Inspection Analysis
              case ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home:
                return (
                  <DesktopAnalysisFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                    selectedRound={selectedRound}
                  />
                );
              //Schedule Management
              case ADMIN_ROUTE_MAP.adminModule.scheduleManagement.home:
                return (
                  <ScheduleManagementFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                  />
                );
                // Dashboard
              case ADMIN_ROUTE_MAP.adminModule.dashboard.home:
                return (
                  <DashboardFilters
                    filterApiCall={filterApiCall}
                    paginationInfo={paginationInfo}
                    selectedRound={selectedRound}
                    setIsFilterOpen={setIsFilterOpen}
                    setPaginationInfo={setPaginationInfo}
                  />
                );
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default GlobalFilter;
