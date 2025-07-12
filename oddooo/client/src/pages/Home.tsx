import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Question {
  id: string
  title: string
  description: string
  voteCount: number
  answerCount: number
  createdAt: string
  userVote: number | null
  author: {
    id: string
    username: string
    avatar?: string
  }
  tags: Array<{
    id: string
    name: string
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const Home = () => {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [voting, setVoting] = useState<string | null>(null)

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(user?.id && { userId: user.id })
      })

      const response = await axios.get(`/api/questions?${params}`)
      setQuestions(response.data.questions)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (questionId: string, value: number) => {
    if (!user) {
      alert('Please log in to vote')
      return
    }

    setVoting(questionId)
    try {
      await axios.post(`/api/questions/${questionId}/vote`, { value })
      fetchQuestions() // Refresh to get updated vote counts and user vote state
    } catch (error: any) {
      console.error('Error voting:', error)
      alert(error.response?.data?.error || 'Failed to record vote')
    } finally {
      setVoting(null)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [search, selectedTags, sortBy, sortOrder, user?.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
        <Link 
          to="/ask" 
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Ask Question
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">Newest</option>
              <option value="voteCount">Most Voted</option>
              <option value="answerCount">Most Answered</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex gap-4">
              {/* Stats */}
              <div className="flex flex-col items-center space-y-2 text-sm text-gray-500">
                <div className="flex flex-col items-center space-y-1">
                  <button 
                    onClick={() => handleVote(question.id, 1)}
                    disabled={voting === question.id}
                    className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 ${
                      question.userVote === 1 ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <span className="font-semibold">{question.voteCount}</span>
                  <button 
                    onClick={() => handleVote(question.id, -1)}
                    disabled={voting === question.id}
                    className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 ${
                      question.userVote === -1 ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    <ThumbsDown size={16} />
                  </button>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare size={16} />
                  <span>{question.answerCount}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <Link 
                  to={`/questions/${question.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-primary-600 mb-2 block"
                >
                  {question.title}
                </Link>
                <p className="text-gray-600 mb-3">
                  {truncateText(question.description, 200)}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {question.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 cursor-pointer"
                      onClick={() => setSelectedTags([tag.name])}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>by {question.author.username}</span>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDate(question.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchQuestions(page)}
                className={`px-3 py-2 rounded-lg ${
                  page === pagination.page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No questions found.</p>
          <Link 
            to="/ask" 
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Ask the first question
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home 