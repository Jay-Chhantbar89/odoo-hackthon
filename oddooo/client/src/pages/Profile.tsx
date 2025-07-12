import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Calendar, MessageSquare, ThumbsUp } from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    questions: 0,
    answers: 0
  })

  useEffect(() => {
    // TODO: Fetch user stats
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">Member since {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-primary-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Questions Asked</p>
              <p className="text-2xl font-bold text-gray-900">{stats.questions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <ThumbsUp className="text-primary-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Answers Given</p>
              <p className="text-2xl font-bold text-gray-900">{stats.answers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity to display.</p>
        </div>
      </div>
    </div>
  )
}

export default Profile 