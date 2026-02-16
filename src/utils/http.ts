import {
	Request,
	Response
} from 'express'
import { validationResult } from 'express-validator'

export const buildResponse = (data: any, message: string) => ({
	data,
	message
})

export const handleValidationResult = (req: Request, res: Response): boolean => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const firstError = errors.array()[0]
		res.status(400).json(buildResponse({}, firstError.msg))
		return false
	}
	return true
}

