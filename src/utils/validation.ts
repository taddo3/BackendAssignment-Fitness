import { body, param, query, ValidationChain } from 'express-validator'
import { EXERCISE_DIFFICULTY, USER_ROLE } from './enums'

/**
 * Centralized validation service
 * Provides reusable validation rules and schemas for request body, query, and params
 */

// ==================== Common Validation Rules ====================

/**
 * Validates email format
 */
export const validateEmail = (field: string = 'email'): ValidationChain => {
	return body(field)
		.trim()
		.isEmail()
		.withMessage('Email must be a valid email')
}

/**
 * Validates required string field
 */
export const validateRequiredString = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.trim()
		.notEmpty()
		.withMessage(fieldName ? `${fieldName} is required` : `${field} is required`)
}

/**
 * Validates optional string field (if provided, must not be empty)
 */
export const validateOptionalString = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.optional()
		.trim()
		.notEmpty()
		.withMessage(fieldName ? `${fieldName} cannot be empty` : `${field} cannot be empty`)
}

/**
 * Validates positive integer
 */
export const validatePositiveInteger = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.isInt({ min: 1 })
		.withMessage(fieldName ? `${fieldName} must be a positive integer` : `${field} must be a positive integer`)
}

/**
 * Validates non-negative integer
 */
export const validateNonNegativeInteger = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.isInt({ min: 0 })
		.withMessage(fieldName ? `${fieldName} must be a non-negative integer` : `${field} must be a non-negative integer`)
}

/**
 * Validates optional positive integer
 */
export const validateOptionalPositiveInteger = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.optional()
		.isInt({ min: 1 })
		.withMessage(fieldName ? `${fieldName} must be a positive integer` : `${field} must be a positive integer`)
}

/**
 * Validates password (minimum length)
 */
export const validatePassword = (field: string = 'password', minLength: number = 6): ValidationChain => {
	return body(field)
		.isLength({ min: minLength })
		.withMessage(`Password must be at least ${minLength} characters long`)
}

/**
 * Validates enum value
 */
export const validateEnum = (field: string, enumValues: string[], fieldName?: string): ValidationChain => {
	return body(field)
		.isIn(enumValues)
		.withMessage(fieldName ? `Invalid ${fieldName}` : `Invalid ${field}`)
}

/**
 * Validates optional enum value
 */
export const validateOptionalEnum = (field: string, enumValues: string[], fieldName?: string): ValidationChain => {
	return body(field)
		.optional()
		.isIn(enumValues)
		.withMessage(fieldName ? `Invalid ${fieldName}` : `Invalid ${field}`)
}

/**
 * Validates ISO8601 date
 */
export const validateISO8601Date = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.optional()
		.isISO8601()
		.withMessage(fieldName ? `${fieldName} must be a valid ISO8601 date` : `${field} must be a valid ISO8601 date`)
}

/**
 * Validates URL parameter as positive integer
 */
export const validateParamId = (paramName: string = 'id', fieldName?: string): ValidationChain => {
	return param(paramName)
		.isInt({ min: 1 })
		.withMessage(fieldName ? `${fieldName} must be a positive integer` : `${paramName} must be a positive integer`)
}

/**
 * Validates query parameter as optional positive integer
 */
export const validateQueryPositiveInteger = (queryName: string, fieldName?: string): ValidationChain => {
	return query(queryName)
		.optional()
		.isInt({ min: 1 })
		.withMessage(fieldName ? `${fieldName} must be a positive integer` : `${queryName} must be a positive integer`)
}

/**
 * Validates query parameter as optional string (if provided, must not be empty)
 */
export const validateQueryOptionalString = (queryName: string, fieldName?: string): ValidationChain => {
	return query(queryName)
		.optional()
		.trim()
		.notEmpty()
		.withMessage(fieldName ? `${fieldName} cannot be empty` : `${queryName} cannot be empty`)
}

/**
 * Validates query parameter for pagination limit
 */
export const validateQueryLimit = (queryName: string = 'limit', min: number = 1, max: number = 100): ValidationChain => {
	return query(queryName)
		.optional()
		.isInt({ min, max })
		.withMessage(`${queryName} must be between ${min} and ${max}`)
}

/**
 * Validates query parameter for pagination page
 */
export const validateQueryPage = (queryName: string = 'page'): ValidationChain => {
	return query(queryName)
		.optional()
		.isInt({ min: 1 })
		.withMessage(`${queryName} must be a positive integer`)
}

// ==================== Validation Schemas ====================

/**
 * Registration validation schema
 */
export const registerValidation = [
	validateRequiredString('name', 'Name'),
	validateRequiredString('surname', 'Surname'),
	validateRequiredString('nickName', 'NickName'),
	validateEmail('email'),
	validateNonNegativeInteger('age', 'Age'),
	validateEnum('role', Object.values(USER_ROLE), 'role'),
	validatePassword('password', 6)
]

/**
 * Login validation schema
 */
export const loginValidation = [
	validateEmail('email'),
	body('password').notEmpty().withMessage('Password is required')
]

/**
 * Create exercise validation schema
 */
export const createExerciseValidation = [
	validateRequiredString('name', 'Name'),
	validateEnum('difficulty', Object.values(EXERCISE_DIFFICULTY), 'difficulty'),
	validateOptionalPositiveInteger('programID', 'programID')
]

/**
 * Update exercise validation schema
 */
export const updateExerciseValidation = [
	validateParamId('id', 'Exercise id'),
	validateOptionalString('name', 'Name'),
	validateOptionalEnum('difficulty', Object.values(EXERCISE_DIFFICULTY), 'difficulty'),
	validateOptionalPositiveInteger('programID', 'programID')
]

/**
 * Delete exercise validation schema
 */
export const deleteExerciseValidation = [
	validateParamId('id', 'Exercise id')
]

/**
 * Get exercises query validation schema
 */
export const getExercisesQueryValidation = [
	validateQueryPage('page'),
	validateQueryLimit('limit', 1, 100),
	validateQueryPositiveInteger('programID', 'programID'),
	validateQueryOptionalString('search', 'Search')
]

/**
 * Get user by ID validation schema
 */
export const getUserByIdValidation = [
	validateParamId('id', 'User id')
]

/**
 * Update user validation schema
 */
export const updateUserValidation = [
	validateParamId('id', 'User id'),
	validateOptionalString('name', 'Name'),
	validateOptionalString('surname', 'Surname'),
	validateOptionalString('nickName', 'NickName'),
	body('age').optional().isInt({ min: 0 }).withMessage('Age must be a non-negative integer'),
	validateOptionalEnum('role', Object.values(USER_ROLE), 'role')
]

/**
 * Add exercise to program validation schema
 */
export const addExerciseToProgramValidation = [
	validateParamId('programId', 'Program id'),
	validateParamId('exerciseId', 'Exercise id')
]

/**
 * Remove exercise from program validation schema
 */
export const removeExerciseFromProgramValidation = [
	validateParamId('programId', 'Program id'),
	validateParamId('exerciseId', 'Exercise id')
]

/**
 * Track user exercise validation schema
 */
export const trackUserExerciseValidation = [
	validatePositiveInteger('exerciseId', 'exerciseId'),
	validatePositiveInteger('durationSeconds', 'durationSeconds'),
	validateISO8601Date('completedAt', 'completedAt')
]

/**
 * Delete user exercise validation schema
 */
export const deleteUserExerciseValidation = [
	validateParamId('id', 'User exercise id')
]

/**
 * Validates optional non-negative integer
 */
export const validateOptionalNonNegativeInteger = (field: string, fieldName?: string): ValidationChain => {
	return body(field)
		.optional()
		.isInt({ min: 0 })
		.withMessage(fieldName ? `${fieldName} must be a non-negative integer` : `${field} must be a non-negative integer`)
}
