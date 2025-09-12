import { useState } from 'react'
import { CheckCircle, Circle, ChevronUp, ChevronDown } from 'lucide-react'

const WorkflowStepper = ({ stages, currentStage, onStageChange, stageCounts = {} }) => {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage)
  const [showAllStages, setShowAllStages] = useState(false)
  
  // Show first 8 stages by default, with option to expand
  const visibleStages = showAllStages ? stages : stages.slice(0, 8)
  const hasMoreStages = stages.length > 8

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Stages</h3>
        {hasMoreStages && (
          <button
            onClick={() => setShowAllStages(!showAllStages)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
          >
            {showAllStages ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show All {stages.length} Stages
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex items-center space-x-4 min-w-max pb-4">
          {visibleStages.map((stage, index) => {
            const Icon = stage.icon
            const count = stageCounts[stage.id] || 0
            const isActive = stage.id === currentStage
            const isCompleted = index < currentIndex
            const isClickable = count > 0 || isActive
            const actualIndex = stages.findIndex(s => s.id === stage.id)

            return (
              <div key={stage.id} className="flex items-center">
                {/* Stage Circle */}
                <div className="flex flex-col items-center min-w-max">
                  <button
                    onClick={() => isClickable && onStageChange(stage.id)}
                    disabled={!isClickable}
                    title={stage.description}
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                      ${isActive 
                        ? 'border-primary-500 bg-primary-500 text-white shadow-lg' 
                        : isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : count > 0
                            ? 'border-gray-300 bg-white text-gray-600 hover:border-primary-300 cursor-pointer hover:shadow-md'
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                    
                    {/* Count Badge */}
                    {count > 0 && (
                      <span className={`
                        absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                        ${isActive || isCompleted
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'bg-primary-500 text-white'
                        }
                      `}>
                        {count}
                      </span>
                    )}
                  </button>
                  
                  {/* Stage Label */}
                  <div className="mt-2 text-center max-w-20">
                    <p className={`text-xs font-medium leading-tight ${
                      isActive ? 'text-primary-600' : 
                      isCompleted ? 'text-green-600' : 
                      count > 0 ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stage.label}
                    </p>
                    {count > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {count}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < visibleStages.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2 transition-colors
                    ${actualIndex < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Stage Description */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">
              {stages.find(s => s.id === currentStage)?.label}
            </h4>
            <p className="text-sm text-gray-600">
              {stages.find(s => s.id === currentStage)?.description || getStageDescription(currentStage)}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-2xl font-bold text-gray-900">
              {stageCounts[currentStage] || 0}
            </p>
            <p className="text-sm text-gray-500">candidates</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const getStageDescription = (stageId) => {
  const descriptions = {
    'applied': 'Candidates who have submitted their applications',
    'shortlisted': 'Candidates selected for interview consideration',
    'interview-scheduled': 'Candidates with scheduled interview appointments',
    'interview-passed': 'Candidates who successfully passed their interviews',
    'medical-scheduled': 'Candidates scheduled for medical examinations',
    'medical-passed': 'Candidates who passed medical examinations',
    'visa-application': 'Candidates in visa application process',
    'visa-approved': 'Candidates with approved visas',
    'police-clearance': 'Police clearance certificate processing',
    'embassy-attestation': 'Document attestation at embassy',
    'travel-documents': 'Travel documents preparation and verification',
    'flight-booking': 'Flight tickets booking and confirmation',
    'pre-departure': 'Pre-departure orientation and final preparations',
    'departed': 'Candidates who have successfully departed',
    'ready-to-fly': 'Candidates fully processed and ready for deployment'
  }
  
  return descriptions[stageId] || 'Manage candidates in this stage'
}

export default WorkflowStepper