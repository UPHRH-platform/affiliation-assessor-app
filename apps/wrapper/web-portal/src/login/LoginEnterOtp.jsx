import React from "react";
import { Link } from "react-router-dom";

import { Card, Label, Button, Input } from "../components";
import ADMIN_ROUTE_MAP from "../routes/adminRouteMap";

export default function LoginEnterOtp() {
  return (
    <>
      <Card moreClass="shadow-md w-screen sm:px-24 sm:w-[480px] md:w-[600px] py-16">
        <div className="flex flex-col">
          <h1 className="text-2xl text-center font-medium p-6">Login</h1>
          <div className="flex flex-col gap-2">
            <Label htmlFor="otp" text="Email OTP" required></Label>
            <Input
              type="text"
              name="otp"
              id="otp"
              placeholder="0-0-0-0-0-0"
            ></Input>
            <div className="text-sm text-gray-400">
              Enter the 6 digit OTP sent to your email address
            </div>
            {/* <div className="text-red-500 text-sm" >{formErrors.email}</div> */}
          </div>
          <Button
            moreClass="uppercase w-full mt-7 text-white"
            text="Sign in"
          ></Button>
          <Link
            className="text-primary-700 text-center font-medium my-6"
            to={ADMIN_ROUTE_MAP.loginModule.signup}
          >
            <span className="cursor-pointer">Go back, re-enter the email</span>
          </Link>
        </div>
      </Card>
    </>
  );
}


