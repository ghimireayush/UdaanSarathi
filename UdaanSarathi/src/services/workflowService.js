// Workflow Service - Handles post-interview workflow and pipeline management
import workflowData from '../data/workflow.json'
import candidateService from './candidateService.js'
import jobService from './jobService.js'
import applicationService from './applicationService.js'
import interviewService from './interviewService.js'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let workflowCache = deepClone(workflowData)

class WorkflowService {
  /**
   * Get all workflow stages
   * @returns {Promise<Array>} Array of workflow stages
   */
  async getWorkflowStages() {
    await delay(150)
    return deepClone(workflowCache.stages)
  }

  /**
   * Get workflows with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of workflows
   */
  async getWorkflows(filters = {}) {
    await delay()
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch workflows')
    }

    let filteredWorkflows = [...workflowCache.workflows]

    // Apply filters
    if (filters.stage && filters.stage !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.current_stage === filters.stage)
    }

    if (filters.status && filters.status !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.status === filters.status)
    }

    if (filters.job_id) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.job_id === filters.job_id)
    }

    if (filters.candidate_id) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.candidate_id === filters.candidate_id)
    }

    if (filters.assigned_to) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.assigned_to === filters.assigned_to)
    }

    if (filters.priority && filters.priority !== 'all') {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.priority === filters.priority)
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredWorkflows.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.created_at) - new Date(a.created_at)
          case 'oldest':
            return new Date(a.created_at) - new Date(b.created_at)
          case 'priority':
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          case 'progress':
            return b.progress - a.progress
          case 'completion':
            return new Date(a.expected_completion) - new Date(b.expected_completion)
          default:
            return 0
        }
      })
    }

    return filteredWorkflows
  }

  /**
   * Get workflows with detailed candidate and job information
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of workflows with candidate and job details
   */
  async getWorkflowsWithDetails(filters = {}) {
    await delay(400)
    const workflows = await this.getWorkflows(filters)
    const candidates = await candidateService.getCandidates()
    const jobs = await jobService.getJobs()

    return workflows.map(workflow => ({
      ...workflow,
      candidate: candidates.find(c => c.id === workflow.candidate_id),
      job: jobs.find(j => j.id === workflow.job_id)
    }))
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object|null>} Workflow object or null if not found
   */
  async getWorkflowById(workflowId) {
    await delay(200)
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch workflow')
    }

    const workflow = workflowCache.workflows.find(w => w.id === workflowId)
    return workflow ? deepClone(workflow) : null
  }

  /**
   * Create new workflow
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    await delay(500)
    if (shouldSimulateError()) {
      throw new Error('Failed to create workflow')
    }

    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      ...workflowData,
      current_stage: 'interviewed', // Default starting stage
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: 0,
      timeline: [
        {
          stage: 'interviewed',
          completed_at: new Date().toISOString(),
          status: 'completed',
          notes: 'Interview completed, entering post-interview workflow'
        }
      ]
    }

    workflowCache.workflows.push(newWorkflow)
    return deepClone(newWorkflow)
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated workflow or null if not found
   */
  async updateWorkflow(workflowId, updateData) {
    await delay(400)
    if (shouldSimulateError()) {
      throw new Error('Failed to update workflow')
    }

    const workflowIndex = workflowCache.workflows.findIndex(w => w.id === workflowId)
    if (workflowIndex === -1) {
      return null
    }

    workflowCache.workflows[workflowIndex] = {
      ...workflowCache.workflows[workflowIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(workflowCache.workflows[workflowIndex])
  }

  /**
   * Move workflow to next stage
   * @param {string} workflowId - Workflow ID
   * @param {string} nextStage - Next stage name
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated workflow or null if not found
   */
  async moveToNextStage(workflowId, nextStage, notes = '') {
    await delay(400)
    const workflow = await this.getWorkflowById(workflowId)
    if (!workflow) return null

    // Update timeline
    const updatedTimeline = [...workflow.timeline]
    
    // Mark current stage as completed if not already
    const currentStageIndex = updatedTimeline.findIndex(t => t.stage === workflow.current_stage && !t.completed_at)
    if (currentStageIndex >= 0) {
      updatedTimeline[currentStageIndex] = {
        ...updatedTimeline[currentStageIndex],
        completed_at: new Date().toISOString(),
        status: 'completed'
      }
    }

    // Add new stage to timeline
    updatedTimeline.push({
      stage: nextStage,
      completed_at: null,
      status: 'pending',
      notes: notes
    })

    // Calculate progress
    const stages = await this.getWorkflowStages()
    const currentStageOrder = stages.find(s => s.id === nextStage)?.order || 0
    const totalStages = stages.length
    const progress = Math.round((currentStageOrder / totalStages) * 100)

    return this.updateWorkflow(workflowId, {
      current_stage: nextStage,
      timeline: updatedTimeline,
      progress: progress
    })
  }

  /**
   * Complete workflow stage
   * @param {string} workflowId - Workflow ID
   * @param {string} stageId - Stage ID to complete
   * @param {Object} completionData - Completion data (notes, documents, etc.)
   * @returns {Promise<Object|null>} Updated workflow or null if not found
   */
  async completeStage(workflowId, stageId, completionData = {}) {
    await delay(400)
    const workflow = await this.getWorkflowById(workflowId)
    if (!workflow) return null

    // Update timeline
    const updatedTimeline = workflow.timeline.map(timelineItem => {
      if (timelineItem.stage === stageId && !timelineItem.completed_at) {
        return {
          ...timelineItem,
          completed_at: new Date().toISOString(),
          status: 'completed',
          ...completionData
        }
      }
      return timelineItem
    })

    return this.updateWorkflow(workflowId, {
      timeline: updatedTimeline
    })
  }

  /**
   * Add document to workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} documentData - Document data
   * @returns {Promise<Object|null>} Updated workflow or null if not found
   */
  async addDocument(workflowId, documentData) {
    await delay(300)
    const workflow = await this.getWorkflowById(workflowId)
    if (!workflow) return null

    const updatedDocuments = workflow.documents_required.map(doc => {
      if (doc.name === documentData.name) {
        return {
          ...doc,
          status: 'received',
          received_at: new Date().toISOString(),
          ...documentData
        }
      }
      return doc
    })

    return this.updateWorkflow(workflowId, {
      documents_required: updatedDocuments
    })
  }

  /**
   * Get workflows by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of workflows for the candidate
   */
  async getWorkflowsByCandidateId(candidateId) {
    await delay(200)
    return workflowCache.workflows.filter(workflow => workflow.candidate_id === candidateId)
  }

  /**
   * Get workflows by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of workflows for the job
   */
  async getWorkflowsByJobId(jobId) {
    await delay(200)
    return workflowCache.workflows.filter(workflow => workflow.job_id === jobId)
  }

  /**
   * Get workflows by stage
   * @param {string} stage - Workflow stage
   * @returns {Promise<Array>} Array of workflows in specified stage
   */
  async getWorkflowsByStage(stage) {
    await delay(200)
    return workflowCache.workflows.filter(workflow => workflow.current_stage === stage)
  }

  /**
   * Get pipeline metrics
   * @returns {Promise<Object>} Pipeline metrics
   */
  async getPipelineMetrics() {
    await delay(200)
    const metrics = deepClone(workflowCache.pipeline_metrics)

    // Recalculate metrics based on current workflows
    const workflows = workflowCache.workflows
    
    metrics.total_in_pipeline = workflows.filter(w => w.status === 'active').length
    
    // Reset stage counts
    Object.keys(metrics.by_stage).forEach(stage => {
      metrics.by_stage[stage] = workflows.filter(w => 
        w.current_stage === stage && w.status === 'active'
      ).length
    })

    return metrics
  }

  /**
   * Get deployment schedule
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of deployment schedules
   */
  async getDeploymentSchedule(filters = {}) {
    await delay(200)
    let deployments = [...workflowCache.deployment_schedule]

    if (filters.month) {
      deployments = deployments.filter(deployment => {
        const deploymentDate = new Date(deployment.expected_date)
        return deploymentDate.getMonth() === filters.month
      })
    }

    if (filters.status && filters.status !== 'all') {
      deployments = deployments.filter(deployment => deployment.status === filters.status)
    }

    return deployments
  }

  /**
   * Schedule deployment
   * @param {Object} deploymentData - Deployment data
   * @returns {Promise<Object>} Created deployment schedule
   */
  async scheduleDeployment(deploymentData) {
    await delay(400)
    if (shouldSimulateError()) {
      throw new Error('Failed to schedule deployment')
    }

    const newDeployment = {
      id: `deployment_${Date.now()}`,
      ...deploymentData,
      status: 'scheduled',
      created_at: new Date().toISOString()
    }

    workflowCache.deployment_schedule.push(newDeployment)
    return deepClone(newDeployment)
  }

  /**
   * Update deployment schedule
   * @param {string} deploymentId - Deployment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated deployment or null if not found
   */
  async updateDeployment(deploymentId, updateData) {
    await delay(300)
    const deploymentIndex = workflowCache.deployment_schedule.findIndex(d => d.id === deploymentId)
    if (deploymentIndex === -1) {
      return null
    }

    workflowCache.deployment_schedule[deploymentIndex] = {
      ...workflowCache.deployment_schedule[deploymentIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(workflowCache.deployment_schedule[deploymentIndex])
  }

  /**
   * Get document checklist
   * @returns {Promise<Object>} Document checklist
   */
  async getDocumentChecklist() {
    await delay(150)
    return deepClone(workflowCache.document_checklist)
  }

  /**
   * Get processing times
   * @returns {Promise<Object>} Processing time estimates
   */
  async getProcessingTimes() {
    await delay(150)
    return deepClone(workflowCache.processing_times)
  }

  /**
   * Get workflows requiring attention
   * @returns {Promise<Array>} Array of workflows that need attention
   */
  async getWorkflowsRequiringAttention() {
    await delay(200)
    const now = new Date()
    
    return workflowCache.workflows.filter(workflow => {
      // Workflows overdue
      if (workflow.expected_completion && new Date(workflow.expected_completion) < now) {
        return true
      }
      
      // Workflows stuck in same stage for too long
      const lastUpdate = new Date(workflow.updated_at)
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) { // More than 7 days without update
        return true
      }
      
      // Workflows with missing documents
      const hasMissingDocuments = workflow.documents_required?.some(doc => 
        doc.status === 'pending'
      )
      
      return hasMissingDocuments
    })
  }

  /**
   * Get workflow statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Workflow statistics
   */
  async getWorkflowStatistics(filters = {}) {
    await delay(200)
    const workflows = await this.getWorkflows(filters)
    
    const stats = {
      total: workflows.length,
      byStage: {},
      byStatus: {},
      byPriority: {},
      averageProgress: 0,
      completionRate: 0,
      overdue: 0
    }

    // Group by stage
    workflows.forEach(workflow => {
      stats.byStage[workflow.current_stage] = (stats.byStage[workflow.current_stage] || 0) + 1
    })

    // Group by status
    workflows.forEach(workflow => {
      stats.byStatus[workflow.status] = (stats.byStatus[workflow.status] || 0) + 1
    })

    // Group by priority
    workflows.forEach(workflow => {
      stats.byPriority[workflow.priority] = (stats.byPriority[workflow.priority] || 0) + 1
    })

    // Calculate average progress
    if (workflows.length > 0) {
      const totalProgress = workflows.reduce((sum, workflow) => sum + workflow.progress, 0)
      stats.averageProgress = totalProgress / workflows.length
    }

    // Calculate completion rate
    const completedWorkflows = workflows.filter(w => w.progress === 100)
    stats.completionRate = workflows.length > 0 ? (completedWorkflows.length / workflows.length) * 100 : 0

    // Count overdue workflows
    const now = new Date()
    stats.overdue = workflows.filter(workflow => 
      workflow.expected_completion && new Date(workflow.expected_completion) < now
    ).length

    return stats
  }

  /**
   * Generate workflow report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Workflow report
   */
  async generateWorkflowReport(options = {}) {
    await delay(500)
    
    const [
      workflows,
      metrics,
      deployments,
      statistics,
      processingTimes
    ] = await Promise.all([
      this.getWorkflowsWithDetails(options.filters),
      this.getPipelineMetrics(),
      this.getDeploymentSchedule(options.filters),
      this.getWorkflowStatistics(options.filters),
      this.getProcessingTimes()
    ])

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: options.period || 'current',
        filters: options.filters || {}
      },
      summary: statistics,
      workflows,
      pipeline_metrics: metrics,
      deployments,
      processing_times: processingTimes,
      recommendations: this.generateRecommendations(statistics, workflows)
    }
  }

  /**
   * Generate recommendations based on workflow data
   * @param {Object} statistics - Workflow statistics
   * @param {Array} workflows - Workflow data
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(statistics, workflows) {
    const recommendations = []

    if (statistics.overdue > 0) {
      recommendations.push({
        type: 'urgent',
        message: `${statistics.overdue} workflows are overdue. Review and expedite processing.`,
        action: 'review_overdue'
      })
    }

    if (statistics.averageProgress < 50) {
      recommendations.push({
        type: 'warning',
        message: 'Average workflow progress is low. Consider process optimization.',
        action: 'optimize_process'
      })
    }

    const documentsStage = statistics.byStage['document_verification'] || 0
    if (documentsStage > statistics.total * 0.3) {
      recommendations.push({
        type: 'info',
        message: 'Many workflows are stuck at document verification. Review documentation requirements.',
        action: 'review_documents'
      })
    }

    return recommendations
  }
}

// Create and export singleton instance
const workflowService = new WorkflowService()
export default workflowService