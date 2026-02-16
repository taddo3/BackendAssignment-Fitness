import {
	Request,
	Response
} from 'express'
import { validationResult } from 'express-validator'
import { LocalizedRequest, t } from './localization'

export const buildResponse = (req: LocalizedRequest, data: any, message: string) => {
	return {
		data,
		message: t(req, message)
	}
}

/**
 * Get localized field name for validation messages
 */
const getLocalizedFieldName = (req: LocalizedRequest, fieldName: string): string => {
	// Try exact match first
	let localized = t(req, fieldName)
	if (localized !== fieldName) {
		return localized
	}
	
	// Try capitalized version
	const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
	localized = t(req, capitalized)
	if (localized !== capitalized) {
		return localized
	}
	
	// Fallback to capitalized version for better UX
	return capitalized
}

export const handleValidationResult = (req: LocalizedRequest, res: Response): boolean => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const firstError = errors.array()[0]
		const fieldName = firstError.type === 'field' ? firstError.path : ''
		
		// Check if the message is a template (contains {fieldName} or other placeholders)
		let message = firstError.msg
		const params: Record<string, string | number> = {}
		
		// Extract field name and use localized version
		if (fieldName) {
			const localizedFieldName = getLocalizedFieldName(req, fieldName)
			params.fieldName = localizedFieldName
			
			// Handle special cases for known fields with min/max values
			if (fieldName === 'limit' && message.includes('{min}') && message.includes('{max}')) {
				params.min = 1
				params.max = 100
			}
			
			// If message is a template, use it with params
			if (message.includes('{fieldName}') || message.includes('{min}') || message.includes('{max}')) {
				message = t(req, message, params)
			} else {
				// If message already contains the field name, try to replace it
				// This handles cases where validation functions generate messages directly
				const originalFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
				if (message.includes(originalFieldName) || message.includes(fieldName)) {
					// Try to find a template pattern
					if (message.includes('is required')) {
						message = t(req, '{fieldName} is required', params)
					} else if (message.includes('cannot be empty')) {
						message = t(req, '{fieldName} cannot be empty', params)
					} else if (message.includes('must be a positive integer')) {
						message = t(req, '{fieldName} must be a positive integer', params)
					} else if (message.includes('must be a non-negative integer')) {
						message = t(req, '{fieldName} must be a non-negative integer', params)
					} else if (message.includes('must be a valid email')) {
						message = t(req, '{fieldName} must be a valid email', params)
					} else if (message.includes('must be at least') && message.includes('characters long')) {
						const minMatch = message.match(/at least (\d+)/)
						if (minMatch) {
							params.min = parseInt(minMatch[1])
							message = t(req, '{fieldName} must be at least {min} characters long', params)
						}
					} else if (message.includes('must be between')) {
						const rangeMatch = message.match(/between (\d+) and (\d+)/)
						if (rangeMatch) {
							params.min = parseInt(rangeMatch[1])
							params.max = parseInt(rangeMatch[2])
							message = t(req, '{fieldName} must be between {min} and {max}', params)
						}
					} else if (message.includes('must be a valid ISO8601 date')) {
						message = t(req, '{fieldName} must be a valid ISO8601 date', params)
					} else if (message.startsWith('Invalid ')) {
						const invalidField = message.replace('Invalid ', '')
						params.fieldName = getLocalizedFieldName(req, invalidField)
						message = t(req, 'Invalid {fieldName}', params)
					} else {
						// Fallback: just translate the message as-is
						message = t(req, message)
					}
				} else {
					message = t(req, message)
				}
			}
		} else {
			// No field name, just translate the message
			message = t(req, message)
		}
		
		res.status(400).json(buildResponse(req, {}, message))
		return false
	}
	return true
}

