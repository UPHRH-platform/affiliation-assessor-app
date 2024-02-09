import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from "../../components/Header";
function ManageRole() {
    return (
    <div >
         <Header></Header>
        <Outlet />
    </div>
  )
}

export default ManageRole
