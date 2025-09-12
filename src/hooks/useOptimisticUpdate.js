import { useState, useCallback } from 'react'

/**
 * Custom hook for optimistic UI updates with automatic rollback on error
 * @param {Array} initialData - Initial data array
 * @returns {Object} Object containing data state and update functions
 */
export const useOptimisticUpdate = (initialData = []) => {
  const [data, setData] = useState(initialData)
  const [pendingUpdates, setPendingUpdates] = useState(new Map())

  /**
   * Apply an optimistic update
   * @param {string} id - Unique identifier for the update
   * @param {Function} updater - Function that returns updated data
   * @param {Function} rollback - Function to rollback the update if it fails
   */
  const optimisticUpdate = useCallback((id, updater, rollback) => {
    // Store rollback function for potential rollback
    setPendingUpdates(prev => new Map(prev.set(id, { updater, rollback })))
    
    // Apply optimistic update immediately
    setData(prevData => updater(prevData))
  }, [])

  /**
   * Confirm that an update was successful
   * @param {string} id - Unique identifier for the update
   */
  const confirmUpdate = useCallback((id) => {
    // Remove from pending updates
    setPendingUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  /**
   * Rollback an update if it failed
   * @param {string} id - Unique identifier for the update
   */
  const rollbackUpdate = useCallback((id) => {
    // Get rollback function
    const pending = pendingUpdates.get(id)
    if (pending) {
      // Apply rollback
      setData(prevData => pending.rollback(prevData))
      
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    }
  }, [pendingUpdates])

  /**
   * Clear all pending updates
   */
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates(new Map())
  }, [])

  return {
    data,
    setData,
    optimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
    clearPendingUpdates,
    hasPendingUpdates: pendingUpdates.size > 0
  }
}

export default useOptimisticUpdate