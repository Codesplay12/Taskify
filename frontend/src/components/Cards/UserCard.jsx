import React from 'react'

const UserCard = ({ userInfo }) => {
  if (!userInfo) return null

  const { pendingTasks = 0, inProgressTasks = 0, completedTasks = 0 } = userInfo

  return (
    <div className='p-4 bg-white rounded-lg shadow mb-4'>
      <div className='flex items-center gap-4'>
        <img
          src={userInfo.profileImageUrl || '/default-avatar.png'}
          alt={userInfo.name}
          className='w-12 h-12 rounded-full border'
        />
        <div>
          <p className='text-sm font-semibold'>{userInfo.name}</p>
          <p className='text-xs text-gray-500'>{userInfo.email}</p>
        </div>
      </div>
      <div className='flex justify-between mt-4'>
        <StatusCard label='Pending' count={pendingTasks} status='Pending' />
        <StatusCard label='In Progress' count={inProgressTasks} status='In Progress'/>
        <StatusCard label='Completed' count={completedTasks} status='Completed' />
      </div>
    </div>
  )
}

const StatusCard = ({ label, count, status }) => {
  const baseStyle = 'flex-1 flex flex-col items-center p-2 rounded text-sm font-medium'
  const colorMap = {
    'Pending': 'bg-purple-50 text-purple-700',
    'In Progress': 'bg-cyan-50 text-cyan-700',
    'Completed': 'bg-green-50 text-green-700'
  }
  return (
    <div className={`${baseStyle} ${colorMap[status] || ''}`}>
      <span className='text-lg font-bold'>{count}</span>
      <span>{label}</span>
    </div>
  )
}

export default UserCard
