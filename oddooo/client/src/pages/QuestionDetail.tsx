import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [question, setQuestion] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState('')
  const [postingAnswer, setPostingAnswer] = useState(false)
  const [voting, setVoting] = useState<string | null>(null) // Track which item is being voted on

  useEffect(() => {
    fetchQuestion()
  }, [id])

  const fetchQuestion = async () => {
    try {
      const params = new URLSearchParams()
      if (user?.id) params.append('userId', user.id)
      
      const response = await axios.get(`/api/questions/${id}?${params.toString()}`)
      setQuestion(response.data)
      setAnswers(response.data.answers || [])
    } catch (error) {
      console.error('Error fetching question:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (type: 'question' | 'answer', id: string, value: number) => {
    if (!user) {
      alert('Please log in to vote')
      return
    }

    setVoting(`${type}-${id}`)
    try {
      const endpoint = type === 'question' ? `/api/questions/${id}/vote` : `/api/answers/${id}/vote`
      await axios.post(endpoint, { value })
      
      // Refresh the question to get updated vote counts
      fetchQuestion()
    } catch (error: any) {
      console.error('Error voting:', error)
      alert(error.response?.data?.error || 'Failed to record vote')
    } finally {
      setVoting(null)
    }
  }

  const handlePostAnswer = async () => {
    if (!user) {
      alert('Please log in to post an answer')
      return
    }

    if (!answerContent.trim() || answerContent.length < 10) {
      alert('Answer must be at least 10 characters long')
      return
    }

    setPostingAnswer(true)
    try {
      await axios.post('/api/answers', {
        content: answerContent,
        questionId: id
      })
      
      setAnswerContent('')
      fetchQuestion() // Refresh to show the new answer
    } catch (error: any) {
      console.error('Error posting answer:', error)
      alert(error.response?.data?.error || 'Failed to post answer')
    } finally {
      setPostingAnswer(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Question not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Back to Questions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Questions</span>
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {question.title}
          </h1>
          
          <div className="flex items-start space-x-4">
            {/* Vote buttons */}
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={() => handleVote('question', question.id, 1)}
                disabled={voting === `question-${question.id}`}
                className={`p-2 hover:text-primary-600 disabled:opacity-50 ${
                  question.userVote === 1 ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <ThumbsUp size={20} />
              </button>
              <span className="text-lg font-semibold text-gray-700">{question.voteCount || 0}</span>
              <button 
                onClick={() => handleVote('question', question.id, -1)}
                disabled={voting === `question-${question.id}`}
                className={`p-2 hover:text-red-600 disabled:opacity-50 ${
                  question.userVote === -1 ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                <ThumbsDown size={20} />
              </button>
            </div>

            {/* Question content */}
            <div className="flex-1">
              <div className="prose max-w-none mb-4">
                <p className="text-gray-700">{question.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags?.map((tag: any) => (
                  <span key={tag.id} className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User size={14} />
                    <span>{question.author?.username}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Answers ({answers.length})
        </h2>
        
        {answers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-center py-8">
              No answers yet. Be the first to answer this question!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <div key={answer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  {/* Vote buttons */}
                  <div className="flex flex-col items-center space-y-2">
                    <button 
                      onClick={() => handleVote('answer', answer.id, 1)}
                      disabled={voting === `answer-${answer.id}`}
                      className={`p-2 hover:text-primary-600 disabled:opacity-50 ${
                        answer.userVote === 1 ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsUp size={20} />
                    </button>
                    <span className="text-lg font-semibold text-gray-700">{answer.voteCount || 0}</span>
                    <button 
                      onClick={() => handleVote('answer', answer.id, -1)}
                      disabled={voting === `answer-${answer.id}`}
                      className={`p-2 hover:text-red-600 disabled:opacity-50 ${
                        answer.userVote === -1 ? 'text-red-600' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsDown size={20} />
                    </button>
                  </div>

                  {/* Answer content */}
                  <div className="flex-1">
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700">{answer.content}</p>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{answer.author?.username}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer form */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Write your answer here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handlePostAnswer}
                disabled={postingAnswer || !answerContent.trim() || answerContent.length < 10}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postingAnswer ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-center py-8">
              Please <Link to="/login" className="text-primary-600 hover:text-primary-700">log in</Link> to post an answer.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionDetail 