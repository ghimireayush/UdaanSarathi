import React, { createContext, useContext } from 'react'
import { useNotifications } from '../components/InteractiveUI/InteractiveNotification'
import InteractiveNotification from '../components/InteractiveUI/InteractiveNotification'

const NotificationContext = createContext()

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const notifications = useNotifications()

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
      
      {/* Render Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.notifications.map(notification => (
          <InteractiveNotification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            isVisible={true}
            onClose={() => notifications.removeNotification(notification.id)}
            autoClose={notification.autoClose !== false}
            autoCloseDelay={notification.autoCloseDelay || 5000}
            {...notification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}