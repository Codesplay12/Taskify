import React, { useEffect, useState } from 'react'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPath'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import UserCard from '../../components/Cards/UserCard'
import { LuFileSpreadsheet } from 'react-icons/lu'
import toast from 'react-hot-toast'

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([])

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS)
      if (Array.isArray(response.data)) {
        setAllUsers(response.data)
      }
    } catch (error) {
      console.error("Error fetching users", error)
    }
  }

  const handleDownloadReport = async () => {
  try {
    const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url); // <-- fixed this line
  } catch (err) {
    console.error("Error downloading report", err);
    toast.error("Failed to download report. Please try again");
  }
};


  useEffect(() => {
    getAllUsers()
  }, [])

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className='mt-5 mb-10'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-medium'>Team Members</h2>
          <button
            className='flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100'
            onClick={handleDownloadReport}
          >
            <LuFileSpreadsheet className='text-lg' />
            Download Report
          </button>
        </div>

        {allUsers.length ? (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
            {allUsers.map(user => (
              <UserCard key={user._id} userInfo={user} />
            ))}
          </div>
        ) : (
          <p className='mt-6 text-center text-gray-500'>
            No team members found.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManageUsers
