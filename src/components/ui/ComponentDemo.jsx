import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from './Card'
import { Modal } from './Modal'
import { Alert } from './Alert'
import { Plus, X, Check, AlertCircle, Info } from 'lucide-react'

const ComponentDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alerts, setAlerts] = useState([])

  const addAlert = (variant, title, message) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, variant, title, message }])
  }

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>UI Component Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Buttons with Icons</h3>
            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Add Item</Button>
              <Button rightIcon={<X className="w-4 h-4" />}>Close</Button>
              <Button variant="success" leftIcon={<Check className="w-4 h-4" />}>Confirm</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Loading Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button loading>Loading...</Button>
              <Button variant="secondary" loading>Loading...</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Alerts</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => addAlert('default', 'Default Alert', 'This is a default alert message')}
              >
                Show Default Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addAlert('success', 'Success Alert', 'Operation completed successfully!')}
              >
                Show Success Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addAlert('warning', 'Warning Alert', 'Please check your input')}
              >
                Show Warning Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addAlert('error', 'Error Alert', 'Something went wrong')}
              >
                Show Error Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addAlert('info', 'Info Alert', 'Here\'s some useful information')}
              >
                Show Info Alert
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.map(alert => (
                <Alert
                  key={alert.id}
                  variant={alert.variant}
                  title={alert.title}
                  onClose={() => removeAlert(alert.id)}
                >
                  {alert.message}
                </Alert>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Modal</h3>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            This demo showcases the new UI components with brand colors and glass-morphism effects.
          </p>
        </CardFooter>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Component Demo Modal"
        size="md"
      >
        <div className="space-y-4">
          <p>This is a modal component with glass-morphism effects and smooth animations.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ComponentDemo