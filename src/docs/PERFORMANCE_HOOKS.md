# Performance Hooks Documentation

This document outlines the performance optimization hooks that have been implemented in the Udaan Sarathi application to improve code quality and application performance.

## useDebounce Hook

The useDebounce hook provides debouncing functionality for values, which is particularly useful for search inputs and other user interactions that trigger expensive operations.

### Usage

```jsx
import { useDebounce } from '../hooks/useDebounce'
import { useState, useEffect } from 'react'

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search operation
      performSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| value | any | null | Value to debounce |
| delay | number | 0 | Debounce delay in milliseconds |

### Returns

Returns the debounced value that updates after the specified delay.

## useOptimisticUpdate Hook

The useOptimisticUpdate hook provides optimistic UI updates with automatic rollback functionality for better user experience.

### Usage

```jsx
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate'
import { useState } from 'react'

const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build an app', completed: true }
  ])
  
  const {
    data: optimisticTodos,
    optimisticUpdate,
    confirmUpdate,
    rollbackUpdate
  } = useOptimisticUpdate(todos)

  const toggleTodo = async (id) => {
    const updateId = `toggle_${id}_${Date.now()}`
    
    // Apply optimistic update
    optimisticUpdate(
      updateId,
      (prevTodos) => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
      (prevTodos) => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )

    try {
      // Make API call
      await api.toggleTodo(id)
      // Confirm update if successful
      confirmUpdate(updateId)
    } catch (error) {
      // Rollback if failed
      rollbackUpdate(updateId)
      console.error('Failed to toggle todo:', error)
    }
  }

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  )
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| initialData | Array | [] | Initial data array |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| data | Array | Current data state |
| setData | Function | Function to set data directly |
| optimisticUpdate | Function | Function to apply optimistic update |
| confirmUpdate | Function | Function to confirm successful update |
| rollbackUpdate | Function | Function to rollback failed update |
| clearPendingUpdates | Function | Function to clear all pending updates |
| hasPendingUpdates | boolean | Whether there are pending updates |

## useLazyLoading Hook

The useLazyLoading hook provides lazy loading functionality using Intersection Observer API for better performance.

### Usage

```jsx
import { useLazyLoading } from '../hooks/useLazyLoading'
import { useState } from 'react'

const LazyImage = ({ src, alt }) => {
  const [imageData, setImageData] = useState(null)
  const { elementRef, isLoading, hasLoaded } = useLazyLoading(async () => {
    // Load image data
    const response = await fetch(src)
    const blob = await response.blob()
    setImageData(URL.createObjectURL(blob))
  })

  return (
    <div ref={elementRef}>
      {isLoading && <div>Loading...</div>}
      {hasLoaded && imageData && <img src={imageData} alt={alt} />}
    </div>
  )
}

const InfiniteList = () => {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  
  const { elementRef, isLoading } = useLazyLoading(async () => {
    // Load more items
    const newItems = await api.getItems(page)
    setItems(prev => [...prev, ...newItems])
    setPage(prev => prev + 1)
  })

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <div ref={elementRef}>
        {isLoading && <div>Loading more items...</div>}
      </div>
    </div>
  )
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| loadFunction | Function | null | Function to load data when element becomes visible |
| options | Object | {} | Intersection observer options |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| threshold | number | 0.1 | Threshold for intersection |
| rootMargin | string | '0px' | Root margin for intersection |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| elementRef | Ref | Ref to attach to the element to observe |
| isLoading | boolean | Whether data is currently loading |
| hasLoaded | boolean | Whether data has been loaded |
| isVisible | boolean | Whether element is currently visible |

## useApiCache Hook

The useApiCache hook provides caching functionality for API responses to reduce unnecessary network requests.

### Usage

```jsx
import { useApiCache } from '../hooks/useApiCache'
import { useState, useEffect } from 'react'

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const cache = useApiCache('users', 10 * 60 * 1000) // 10 minute TTL

  useEffect(() => {
    const fetchUser = async () => {
      // Check cache first
      const cachedUser = cache.get(userId)
      if (cachedUser) {
        setUser(cachedUser)
        return
      }

      setLoading(true)
      try {
        const userData = await api.getUser(userId)
        setUser(userData)
        // Cache the result
        cache.set(userId, userData)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId, cache])

  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return <div>{user.name}</div>
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| cacheKey | string | null | Unique key for the cache instance |
| ttl | number | 300000 (5 minutes) | Time to live in milliseconds |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| get | Function | Function to get cached data |
| set | Function | Function to set cached data |
| clear | Function | Function to clear specific cache entry |
| clearAll | Function | Function to clear all cache entries |
| cacheSize | number | Current number of cached items |

## Performance Benefits

### Debounced Search
- Reduces API calls during rapid typing
- Improves user experience with delayed but accurate results
- Prevents UI freezing during expensive search operations

### Optimistic Updates
- Provides instant UI feedback for user actions
- Reduces perceived latency
- Automatically handles error rollback for data consistency

### Lazy Loading
- Reduces initial page load time
- Improves memory usage
- Enhances scrolling performance
- Loads content only when needed

### API Caching
- Reduces network requests for repeated data
- Improves application responsiveness
- Reduces server load
- Provides offline capability for cached data

## Implementation Examples

### Search with Debouncing

```jsx
const JobSearch = () => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (debouncedQuery) {
      setLoading(true)
      searchJobs(debouncedQuery)
        .then(results => setJobs(results))
        .finally(() => setLoading(false))
    }
  }, [debouncedQuery])

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search jobs..."
      />
      {loading && <div>Searching...</div>}
      {jobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  )
}
```

### Optimistic Todo Toggle

```jsx
const TodoItem = ({ todo, onToggle }) => {
  const {
    data: [optimisticTodo],
    optimisticUpdate,
    confirmUpdate,
    rollbackUpdate
  } = useOptimisticUpdate([todo])

  const handleToggle = async () => {
    const updateId = `toggle_${todo.id}`
    
    optimisticUpdate(
      updateId,
      ([prev]) => [{ ...prev, completed: !prev.completed }],
      ([prev]) => [{ ...prev, completed: !prev.completed }]
    )

    try {
      await onToggle(todo.id)
      confirmUpdate(updateId)
    } catch (error) {
      rollbackUpdate(updateId)
    }
  }

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={optimisticTodo.completed}
        onChange={handleToggle}
      />
      <span className={optimisticTodo.completed ? 'line-through' : ''}>
        {optimisticTodo.text}
      </span>
    </div>
  )
}
```

### Lazy Loading Images

```jsx
const CandidateList = ({ candidates }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map(candidate => (
        <LazyCandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  )
}

const LazyCandidateCard = ({ candidate }) => {
  const { elementRef, hasLoaded } = useLazyLoading(async () => {
    // Load candidate details when card becomes visible
    const details = await api.getCandidateDetails(candidate.id)
    // Update candidate with details
  })

  return (
    <div ref={elementRef} className="card">
      <h3>{candidate.name}</h3>
      {hasLoaded && <CandidateDetails candidate={candidate} />}
    </div>
  )
}
```

### API Response Caching

```jsx
const JobDetails = ({ jobId }) => {
  const cache = useApiCache('jobs')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadJob = async () => {
      // Check cache first
      const cached = cache.get(jobId)
      if (cached) {
        setJob(cached)
        return
      }

      setLoading(true)
      try {
        const data = await api.getJob(jobId)
        setJob(data)
        cache.set(jobId, data)
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [jobId, cache])

  if (loading) return <Loading />
  if (!job) return <div>Job not found</div>

  return <JobView job={job} />
}
```

## Testing

The performance hooks have been tested for:
- Correctness of debouncing behavior
- Proper optimistic update handling
- Accurate lazy loading triggers
- Cache expiration and storage
- Memory leaks and performance impact
- Cross-browser compatibility

## Future Enhancements

Planned improvements include:
- Advanced cache eviction strategies
- Network-aware caching
- Background sync for offline support
- Performance monitoring and metrics
- Adaptive debouncing based on device capabilities