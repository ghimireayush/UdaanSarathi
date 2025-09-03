import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  Info,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Tag,
  BarChart3,
  Filter
} from 'lucide-react'
import CandidateShortlist from '../components/CandidateShortlist'
import { formatInNepalTz, getCurrentNepalTime } from '../utils/nepaliDate'
import { rankCandidates, getRankingInsights } from '../services/candidateRankingService'

// Mock data - replace with actual API calls
import jobsData from '../data/jobs.json'
import candidatesData from '../data/candidates.json'

const JobShortlist = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  
  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [rankedCandidates, setRankedCandidates] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInsights, setShowInsights] = useState(false)

  // Workflow stages - this would typically come from a service
  const workflowStages = [
    { id: 'applied', label: 'Applied', color: 'blue' },
    { id: 'shortlisted', label: 'Shortlisted', color: 'yellow' },
    { id: 'scheduled', label: 'Interview Scheduled', color: 'purple' },
    { id: 'interviewed', label: 'Interviewed', color: 'indigo' },
    { id: 'interview-passed', label: 'Interview Passed', color: 'green' },
    { id: 'medical-scheduled', label: 'Medical Scheduled', color: 'orange' },
    { id: 'medical-passed', label: 'Medical Passed', color: 'green' },
    { id: 'visa-application', label: 'Visa Application', color: 'blue' },
    { id: 'visa-approved', label: 'Visa Approved', color: 'green' },
    { id: 'ready-to-fly', label: 'Ready to Fly', color: 'green' },
    { id: 'deployed', label: 'Deployed', color: 'green' },
    { id: 'rejected', label: 'Rejected', color: 'red' }
  ]

  // Load job and candidates data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Find job
        const foundJob = jobsData.find(j => j.id === jobId)
        if (!foundJob) {
          navigate('/jobs')
          return
        }
        setJob(foundJob)

        // Find candidates who applied to this job
        const jobCandidates = candidatesData.filter(candidate => 
          candidate.applied_jobs?.includes(jobId)
        )

        // Rank candidates based on job requirements
        const ranked = rankCandidates(jobCandidates, foundJob, { includeAnalysis: true })
        setRankedCandidates(ranked)
        setCandidates(ranked)

        // Generate insights
        const jobInsights = getRankingInsights(jobCandidates, foundJob)
        setInsights(jobInsights)

      } catch (error) {
        console.error('Error loading job shortlist data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      loadData()
    }
  }, [jobId, navigate])

  const handleUpdateCandidateStatus = async (candidateId, newStage) => {
    try {
      // Update candidate status - this would be an API call
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, stage: newStage }
          : candidate
      )
      setCandidates(updatedCandidates)
      
      // Re-rank if needed
      const reranked = rankCandidates(updatedCandidates, job, { includeAnalysis: true })
      setRankedCandidates(reranked)
      
      console.log(`Updated candidate ${candidateId} to stage: ${newStage}`)
    } catch (error) {
      console.error('Error updating candidate status:', error)
    }
  }

  const handleScheduleInterview = async (candidateId) => {
    try {
      // Schedule interview logic - this would integrate with calendar
      console.log(`Scheduling interview for candidate: ${candidateId}`)
      // Navigate to interview scheduling page or open modal
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job shortlist...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The requested job could not be found.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="btn-primary"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Jobs
              </button>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">Shortlist</span>
            </div>

            {/* Job Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <span className={`chip chip-${job.status === 'published' ? 'green' : 'yellow'}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.city}, {job.country}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {formatInNepalTz(job.published_at || job.created_at, 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {/* Job Tags */}
                {job.tags && job.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Required Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag, index) => (
                        <span key={index} className="chip chip-primary text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6 ml-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{candidates.length}</div>
                  <div className="text-sm text-gray-600">Total Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights?.topCandidates?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Top Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {insights?.averageScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Ranking Insights</span>
                  <Filter className={`w-4 h-4 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
                </button>
                
                {insights.recommendations.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className={`flex items-center space-x-1 text-sm px-2 py-1 rounded ${
                        rec.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        <span>{rec.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showInsights && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score Distribution */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Score Distribution
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Excellent (90%+)</span>
                        <span className="font-medium text-green-600">{insights.scoreDistribution.excellent}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Good (80-89%)</span>
                        <span className="font-medium text-blue-600">{insights.scoreDistribution.good}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average (60-79%)</span>
                        <span className="font-medium text-yellow-600">{insights.scoreDistribution.average}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Below Average (&lt;60%)</span>
                        <span className="font-medium text-red-600">{insights.scoreDistribution.below}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Top Candidates
                    </h3>
                    <div className="space-y-2">
                      {insights.topCandidates.slice(0, 3).map((candidate, index) => (
                        <div key={candidate.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-900 truncate">{candidate.name}</span>
                          <span className="font-medium text-green-600">{candidate.priority_score}%</span>
                        </div>
                      ))}
                      {insights.topCandidates.length === 0 && (
                        <p className="text-sm text-gray-500">No candidates scored above 80%</p>
                      )}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Skill Coverage
                    </h3>
                    <div className="space-y-2">
                      {insights.skillGaps.slice(0, 3).map((gap, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-900 truncate">{gap.skill}</span>
                          <span className="font-medium text-red-600">{gap.coverage}%</span>
                        </div>
                      ))}
                      {insights.skillGaps.length === 0 && (
                        <p className="text-sm text-gray-500">Good skill coverage across all requirements</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CandidateShortlist
          jobId={jobId}
          candidates={rankedCandidates}
          job={job}
          onUpdateCandidateStatus={handleUpdateCandidateStatus}
          onScheduleInterview={handleScheduleInterview}
          workflowStages={workflowStages}
        />
      </div>
    </div>
  )
}

export default JobShortlist