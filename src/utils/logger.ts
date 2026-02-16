import fs from 'fs'
import path from 'path'

const LOGS_DIR = path.join(process.cwd(), 'logs')
const ERROR_LOG_FILE = path.join(LOGS_DIR, 'error.log')

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
	fs.mkdirSync(LOGS_DIR, { recursive: true })
}

interface ErrorLogEntry {
	timestamp: string
	message: string
	stack?: string
	context?: Record<string, any>
}

/**
 * Format error log entry as a string
 */
const formatLogEntry = (entry: ErrorLogEntry): string => {
	let logLine = `[${entry.timestamp}] ${entry.message}`
	
	if (entry.stack) {
		logLine += `\nStack Trace:\n${entry.stack}`
	}
	
	if (entry.context && Object.keys(entry.context).length > 0) {
		logLine += `\nContext: ${JSON.stringify(entry.context, null, 2)}`
	}
	
	return logLine + '\n' + '-'.repeat(80) + '\n'
}

/**
 * Write error log to file
 */
const writeToFile = (entry: ErrorLogEntry): void => {
	try {
		const logLine = formatLogEntry(entry)
		fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf8')
	} catch (fileError) {
		// Fallback: if file writing fails, at least log to console
		console.error('Failed to write error log to file:', fileError)
		console.error('Original error:', entry)
	}
}

/**
 * Log error to both console and file
 * Never exposes error details to users - only logs internally
 */
export const logError = (
	error: Error | unknown,
	contextMessage?: string,
	context?: {
		req?: {
			method?: string
			url?: string
			headers?: Record<string, any>
			body?: any
			params?: any
			query?: any
		}
		[key: string]: any
	}
): void => {
	const timestamp = new Date().toISOString()
	
	// Extract error information
	let errorMessage = 'Unknown error'
	let stack: string | undefined
	
	if (error instanceof Error) {
		errorMessage = error.message
		stack = error.stack
	} else if (typeof error === 'string') {
		errorMessage = error
	} else {
		errorMessage = JSON.stringify(error)
	}
	
	// Build log entry
	const logEntry: ErrorLogEntry = {
		timestamp,
		message: contextMessage ? `${contextMessage}: ${errorMessage}` : errorMessage,
		stack,
		context: context ? {
			...context,
			// Sanitize sensitive data from request context
			req: context.req ? {
				method: context.req.method,
				url: context.req.url,
				// Don't log headers/body/params/query to avoid sensitive data exposure
			} : undefined
		} : undefined
	}
	
	// Log to console (for development/debugging)
	console.error(`[ERROR] ${logEntry.message}`)
	if (stack) {
		console.error(stack)
	}
	
	// Write to file (for production logging)
	writeToFile(logEntry)
}

/**
 * Handle and respond to errors in a user-safe way
 * Always returns generic error message to user, logs details internally
 * Note: This function should be used with buildResponse from http.ts
 */
export const handleError = (
	error: Error | unknown,
	contextMessage?: string,
	context?: Record<string, any>
): void => {
	// Log error with full details (internal only)
	logError(error, contextMessage, context)
}
