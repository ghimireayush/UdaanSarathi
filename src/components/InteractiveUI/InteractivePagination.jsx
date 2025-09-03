import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import InteractiveButton from './InteractiveButton'

const InteractivePagination = ({ 
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(currentPage - half, 1)
    let end = Math.min(start + maxVisiblePages - 1, totalPages)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1)
    }

    const pages = []
    
    // Add first page if not in range
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange?.(page)
    }
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* First Page */}
      {showFirstLast && currentPage > 1 && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex"
        >
          First
        </InteractiveButton>
      )}

      {/* Previous Page */}
      {showPrevNext && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          icon={ChevronLeft}
          className="flex items-center"
        >
          <span className="hidden sm:inline ml-1">Previous</span>
        </InteractiveButton>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )
            }

            return (
              <InteractiveButton
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size={size}
                onClick={() => handlePageClick(page)}
                className={`
                  min-w-[40px] justify-center
                  ${page === currentPage ? 'font-semibold' : ''}
                `}
              >
                {page}
              </InteractiveButton>
            )
          })}
        </div>
      )}

      {/* Next Page */}
      {showPrevNext && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </InteractiveButton>
      )}

      {/* Last Page */}
      {showFirstLast && currentPage < totalPages && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex"
        >
          Last
        </InteractiveButton>
      )}
    </div>
  )
}

// Pagination Info Component
export const PaginationInfo = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  className = '' 
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      Showing {startItem} to {endItem} of {totalItems} results
      {totalPages > 1 && (
        <span className="ml-2">
          (Page {currentPage} of {totalPages})
        </span>
      )}
    </div>
  )
}

// Items Per Page Selector
export const ItemsPerPageSelector = ({ 
  value, 
  onChange, 
  options = [10, 25, 50, 100],
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Show:</span>
      <select
        value={value}
        onChange={(e) => onChange?.(parseInt(e.target.value))}
        className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-600">per page</span>
    </div>
  )
}

export default InteractivePagination