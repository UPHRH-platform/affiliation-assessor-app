import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

import { getCookie, removeCookie, getInitials } from "../utils/common";
import ADMIN_ROUTE_MAP from "../routes/adminRouteMap";

import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import Overlay from "./../pages/notifications/Overlay";

import {
  removeAllFromLocalForage,
} from "./../forms";

export default function Header() {
  const [showButtons, setshowButtons] = useState(false);
  const navigate = useNavigate();
  const regulator = getCookie("regulator");
  const userData = getCookie("userData");
  const instituteData = getCookie("institutes");

  const logout = async () => {
    removeCookie("userData");
    removeCookie("institutes");
    removeCookie("regulator");
    removeCookie("firebase_client_token")
    removeAllFromLocalForage();
    navigate(ADMIN_ROUTE_MAP.loginModule.login);
  };

  const handleNavigateToHome = () => {
    navigate(ADMIN_ROUTE_MAP.adminModule.dashboard);
  };

  useEffect(() => {
    if (instituteData != null) {
      setshowButtons(true);
    }
  }, [instituteData]);

  return (
    <>
      <div className="relative min-h-[80px] z-10 drop-shadow-md">
        <div className="top-0 fixed left-0 right-0 bg-white">
          <div className="container py-2 px-3 mx-auto">
            <div className="flex flex-row">
              <div className="flex flex-grow items-center">
                <img
                  className="cursor-pointer h-[64px]"
                  onClick={handleNavigateToHome}
                  src="/images/upsmf.png"
                  alt="logo"
                />
              </div>
              <div className="flex flex-grow items-center justify-end">
                <div className="flex flex-row gap-8 items-center">
                  <Overlay className="text-3xl text-gray-500" />
                  <Menu placement="bottom-end">
                    <MenuHandler>
                      <button
                        className="w-[44px] h-[44px] border-green-500 bg-green-500 hover:bg-green-400 justify-center items-center rounded-md font-bold shadow-sm p-2 tracking-wider text-base text-white"
                        aria-expanded="true"
                        aria-haspopup="true"
                      >
                        {getInitials(
                          `${userData?.firstName?.trim()} ${userData?.lastName?.trim()}`
                        )}
                      </button>
                    </MenuHandler>
                    <MenuList className="p-[4px]">
                      <MenuItem
                        className="text-gray-700 font-semibold block w-full text-left text-sm p-3"
                        onClick={logout}
                      >
                        Sign out
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
