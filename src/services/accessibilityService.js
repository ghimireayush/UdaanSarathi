// Accessibility service for keyboard navigation and ARIA support
class AccessibilityService {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
    
    this.keyboardHandlers = new Map()
  }

  /**
   * Setup keyboard navigation for right-pane summary
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Navigation options
   */
  setupRightPaneNavigation(container, options = {}) {
    const {
      onEscape = () => {},
      onEnter = () => {},
      onArrowKeys = () => {},
      trapFocus = true
    } = options

    const focusableElements = container.querySelectorAll(this.focusableElements)
    let currentIndex = 0

    const keyHandler = (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          onEscape()
          break
          
        case 'Enter':
          if (event.target.tagName !== 'TEXTAREA') {
            event.preventDefault()
            onEnter(event.target, currentIndex)
          }
          break
          
        case 'ArrowDown':
          event.preventDefault()
          currentIndex = Math.min(currentIndex + 1, focusableElements.length - 1)
          focusableElements[currentIndex]?.focus()
          onArrowKeys('down', currentIndex)
          break
          
        case 'ArrowUp':
          event.preventDefault()
          currentIndex = Math.max(currentIndex - 1, 0)
          focusableElements[currentIndex]?.focus()
          onArrowKeys('up', currentIndex)
          break
          
        case 'Tab':
          if (trapFocus) {
            event.preventDefault()
            if (event.shiftKey) {
              currentIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
            } else {
              currentIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1
            }
            focusableElements[currentIndex]?.focus()
          }
          break
      }
    }

    container.addEventListener('keydown', keyHandler)
    this.keyboardHandlers.set(container, keyHandler)

    // Set initial focus
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    return () => {
      container.removeEventListener('keydown', keyHandler)
      this.keyboardHandlers.delete(container)
    }
  }

  /**
   * Create accessible summary panel
   * @param {Object} data - Summary data
   * @param {Object} options - Panel options
   * @returns {HTMLElement} Accessible summary panel
   */
  createAccessibleSummary(data, options = {}) {
    const {
      title = 'Summary',
      level = 2,
      expandable = true
    } = options

    const panel = document.createElement('div')
    panel.className = 'accessible-summary-panel'
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-labelledby', `summary-title-${Date.now()}`)

    const titleElement = document.createElement(`h${level}`)
    titleElement.id = `summary-title-${Date.now()}`
    titleElement.textContent = title
    titleElement.className = 'summary-title'

    if (expandable) {
      const button = document.createElement('button')
      button.setAttribute('aria-expanded', 'true')
      button.setAttribute('aria-controls', `summary-content-${Date.now()}`)
      button.className = 'summary-toggle'
      button.innerHTML = `
        <span class="sr-only">Toggle ${title}</span>
        <svg aria-hidden="true" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      `
      
      titleElement.appendChild(button)
    }

    const content = document.createElement('div')
    content.id = `summary-content-${Date.now()}`
    content.className = 'summary-content'
    content.setAttribute('role', 'group')

    // Add summary items
    Object.entries(data).forEach(([key, value]) => {
      const item = document.createElement('div')
      item.className = 'summary-item'
      item.setAttribute('role', 'listitem')
      
      const label = document.createElement('dt')
      label.textContent = key
      label.className = 'summary-label'
      
      const valueEl = document.createElement('dd')
      valueEl.textContent = value
      valueEl.className = 'summary-value'
      valueEl.setAttribute('aria-describedby', `${key}-label`)
      
      item.appendChild(label)
      item.appendChild(valueEl)
      content.appendChild(item)
    })

    panel.appendChild(titleElement)
    panel.appendChild(content)

    return panel
  }

  /**
   * Announce changes to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Announcement priority (polite|assertive)
   */
  announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Setup skip links for better navigation (deprecated - use Layout component skip link instead)
   * @param {Array} links - Skip link configurations
   */
  setupSkipLinks(links) {
    // Skip links are now handled by the Layout component
    // This method is kept for backward compatibility but does nothing
    console.log('Skip links setup called but handled by Layout component:', links)
  }

  /**
   * Enhance form accessibility
   * @param {HTMLFormElement} form - Form element
   */
  enhanceFormAccessibility(form) {
    const inputs = form.querySelectorAll('input, select, textarea')
    
    inputs.forEach(input => {
      const label = form.querySelector(`label[for="${input.id}"]`)
      if (!label && !input.getAttribute('aria-label')) {
        console.warn('Input missing label:', input)
      }
      
      // Add required indicator
      if (input.required) {
        input.setAttribute('aria-required', 'true')
        if (label) {
          const required = document.createElement('span')
          required.textContent = ' *'
          required.setAttribute('aria-label', 'required')
          required.className = 'required-indicator'
          label.appendChild(required)
        }
      }
      
      // Add error handling
      input.addEventListener('invalid', (e) => {
        const errorId = `${input.id}-error`
        let errorEl = document.getElementById(errorId)
        
        if (!errorEl) {
          errorEl = document.createElement('div')
          errorEl.id = errorId
          errorEl.className = 'error-message'
          errorEl.setAttribute('role', 'alert')
          input.parentNode.insertBefore(errorEl, input.nextSibling)
        }
        
        errorEl.textContent = input.validationMessage
        input.setAttribute('aria-describedby', errorId)
        input.setAttribute('aria-invalid', 'true')
      })
      
      input.addEventListener('input', () => {
        if (input.validity.valid) {
          input.removeAttribute('aria-invalid')
          const errorEl = document.getElementById(`${input.id}-error`)
          if (errorEl) {
            errorEl.remove()
          }
        }
      })
    })
  }

  /**
   * Cleanup keyboard handlers
   */
  cleanup() {
    this.keyboardHandlers.forEach((handler, element) => {
      element.removeEventListener('keydown', handler)
    })
    this.keyboardHandlers.clear()
  }
}

// Create and export singleton instance
const accessibilityService = new AccessibilityService()
export default accessibilityService