import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from './ui/Card'
import { useDebounce } from '../hooks/useDebounce'
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate'
import { useLazyLoading } from '../hooks/useLazyLoading'
import { useApiCache } from '../hooks/useApiCache'
import { Search, Plus, Trash2, Check, X } from 'lucide-react'

const PerformanceDemo = () => {
  // Demo for useDebounce
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [searchResults, setSearchResults] = useState([])

  // Demo for useOptimisticUpdate
  const initialTodos = [
    { id: 1, text: 'Learn React Hooks', completed: false },
    { id: 2, text: 'Build Performance Demo', completed: true },
    { id: 3, text: 'Optimize Application', completed: false }
  ]
  const {
    data: todos,
    optimisticUpdate,
    confirmUpdate,
    rollbackUpdate
  } = useOptimisticUpdate(initialTodos)

  // Demo for useApiCache
  const cache = useApiCache('demo', 5000) // 5 second TTL for demo
  const [cachedData, setCachedData] = useState(null)
  const [cacheStatus, setCacheStatus] = useState('')

  // Simulate search
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Simulate API call
      const results = [
        `Result 1 for "${debouncedSearchTerm}"`,
        `Result 2 for "${debouncedSearchTerm}"`,
        `Result 3 for "${debouncedSearchTerm}"`
      ]
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchTerm])

  // Toggle todo with optimistic update
  const toggleTodo = (id) => {
    const updateId = `toggle_${id}_${Date.now()}`
    
    optimisticUpdate(
      updateId,
      (prevTodos) => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
      (prevTodos) => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )

    // Simulate API call with random success/failure
    setTimeout(() => {
      if (Math.random() > 0.3) { // 70% success rate
        confirmUpdate(updateId)
      } else {
        rollbackUpdate(updateId)
        alert('Failed to update todo. Rollback applied.')
      }
    }, 500)
  }

  // Add new todo
  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    }
    
    const updateId = `add_${newTodo.id}`
    
    optimisticUpdate(
      updateId,
      (prevTodos) => [...prevTodos, newTodo],
      (prevTodos) => prevTodos.filter(todo => todo.id !== newTodo.id)
    )

    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.2) { // 80% success rate
        confirmUpdate(updateId)
      } else {
        rollbackUpdate(updateId)
        alert('Failed to add todo. Rollback applied.')
      }
    }, 300)
  }

  // Delete todo
  const deleteTodo = (id) => {
    const updateId = `delete_${id}_${Date.now()}`
    
    const todoToDelete = todos.find(todo => todo.id === id)
    
    optimisticUpdate(
      updateId,
      (prevTodos) => prevTodos.filter(todo => todo.id !== id),
      (prevTodos) => [...prevTodos, todoToDelete]
    )

    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        confirmUpdate(updateId)
      } else {
        rollbackUpdate(updateId)
        alert('Failed to delete todo. Rollback applied.')
      }
    }, 400)
  }

  // Handle cache operations
  const cacheData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      message: 'This data is cached',
      random: Math.random()
    }
    cache.set('demo_data', data)
    setCachedData(data)
    setCacheStatus('Data cached')
  }

  const getCachedData = () => {
    const data = cache.get('demo_data')
    if (data) {
      setCachedData(data)
      setCacheStatus('Data retrieved from cache')
    } else {
      setCachedData(null)
      setCacheStatus('No cached data found')
    }
  }

  const clearCache = () => {
    cache.clear('demo_data')
    setCachedData(null)
    setCacheStatus('Cache cleared')
  }

  // Demo for useLazyLoading
  const [showLazyDemo, setShowLazyDemo] = useState(false)
  const [lazyContent, setLazyContent] = useState(null)
  
  const { elementRef, isLoading, hasLoaded } = useLazyLoading(async () => {
    // Simulate loading content
    setLazyContent(null)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLazyContent('This content was loaded lazily when it became visible!')
  })

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Hooks Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* useDebounce Demo */}
          <div>
            <h3 className="text-lg font-medium mb-4">Debounced Search</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search (debounced)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
                />
              </div>
              {debouncedSearchTerm && (
                <div className="text-sm text-gray-600">
                  Debounced search term: <strong>{debouncedSearchTerm}</strong>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
                  <h4 className="font-medium mb-2">Search Results:</h4>
                  <ul className="space-y-1">
                    {searchResults.map((result, index) => (
                      <li key={index} className="text-sm">{result}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* useOptimisticUpdate Demo */}
          <div>
            <h3 className="text-lg font-medium mb-4">Optimistic Updates</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new todo..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      addTodo(e.target.value.trim())
                      e.target.value = ''
                    }
                  }}
                />
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add new todo..."]')
                    if (input && input.value.trim()) {
                      addTodo(input.value.trim())
                      input.value = ''
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
                <h4 className="font-medium mb-2">Todo List:</h4>
                <ul className="space-y-2">
                  {todos.map(todo => (
                    <li key={todo.id} className="flex items-center justify-between p-2 hover:bg-white/50 rounded">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          className="mr-2"
                        />
                        <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                          {todo.text}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* useApiCache Demo */}
          <div>
            <h3 className="text-lg font-medium mb-4">API Caching</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={cacheData} variant="secondary">
                  Cache Data
                </Button>
                <Button onClick={getCachedData} variant="secondary">
                  Get Cached Data
                </Button>
                <Button onClick={clearCache} variant="outline">
                  Clear Cache
                </Button>
              </div>
              
              {cacheStatus && (
                <div className="text-sm text-gray-600">
                  Status: <strong>{cacheStatus}</strong>
                </div>
              )}
              
              {cachedData && (
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
                  <h4 className="font-medium mb-2">Cached Data:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(cachedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* useLazyLoading Demo */}
          <div>
            <h3 className="text-lg font-medium mb-4">Lazy Loading</h3>
            <div className="space-y-4">
              <Button 
                onClick={() => setShowLazyDemo(!showLazyDemo)}
                variant="secondary"
              >
                {showLazyDemo ? 'Hide' : 'Show'} Lazy Loading Demo
              </Button>
              
              {showLazyDemo && (
                <div className="space-y-4">
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Scroll down to see lazy loading in action</p>
                  </div>
                  
                  <div className="h-96"></div>
                  
                  <div 
                    ref={elementRef}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50 shadow-lg"
                  >
                    {isLoading && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue-bright"></div>
                        <span className="ml-2">Loading content...</span>
                      </div>
                    )}
                    
                    {hasLoaded && lazyContent && (
                      <div className="text-center">
                        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-lg">{lazyContent}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          This content was loaded only when it became visible in the viewport.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            This demo showcases performance optimization hooks for debounced search, 
            optimistic updates, API caching, and lazy loading.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default PerformanceDemo