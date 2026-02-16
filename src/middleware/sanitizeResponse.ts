import {
	Request,
	Response,
	NextFunction
} from 'express'

// Here we can define more sensitive keys to sanitize 
// or can be defined in .env in the future for more flexibility but less security :D
const SENSITIVE_KEYS = ['password', 'passwordHash']

const sanitizeValue = (value: any): any => {
	if (Array.isArray(value)) {
		return value.map((item) => sanitizeValue(item))
	}

	if (value && typeof value === 'object') {
		const plain = value.toJSON ? value.toJSON() : value
		return Object.keys(plain).reduce((acc: any, key: string) => {
			if (SENSITIVE_KEYS.includes(key)) {
				return acc
			}

			acc[key] = sanitizeValue(plain[key])
			return acc
		}, {})
	}

	return value
}

export const responseSanitizer = (_req: Request, res: Response, next: NextFunction) => {
	const originalJson = res.json.bind(res)

	res.json = (body?: any): Response => {
		const sanitized = sanitizeValue(body)
		return originalJson(sanitized)
	}

	next()
}

