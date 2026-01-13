import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics'
import { app } from './firebase'

let analytics: any = null
let analyticsInitialized = false

// Initialize analytics only in production and when not in SSR context
export const initializeAnalytics = (): void => {
  if (typeof window === 'undefined' || analyticsInitialized) {
    return
  }

  try {
    analytics = getAnalytics(app)
    analyticsInitialized = true
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error)
    analyticsInitialized = true // Mark as initialized to prevent repeated attempts
  }
}

/**
 * Log an event to Firebase Analytics
 * @param eventName - Name of the event
 * @param eventParams - Optional parameters for the event
 */
export const logEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  if (!analyticsInitialized) {
    initializeAnalytics()
  }

  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams)
    } catch (error) {
      console.warn(`Failed to log event "${eventName}":`, error)
    }
  }
}

/**
 * Log a page view event
 * @param pageName - Name of the page
 * @param pageTitle - Title of the page (optional)
 */
export const logPageView = (pageName: string, pageTitle?: string): void => {
  logEvent('page_view', {
    page_path: pageName,
    page_title: pageTitle || document.title,
  })
}

/**
 * Log a user engagement event
 * @param eventName - Name of the event
 * @param eventParams - Event parameters
 */
export const logEngagement = (eventName: string, eventParams?: Record<string, any>): void => {
  logEvent(eventName, eventParams)
}
