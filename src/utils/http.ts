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

export const handleValidationResult = (req: LocalizedRequest, res: Response): boolean => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const firstError = errors.array()[0]
		res.status(400).json(buildResponse(req, {}, t(req, firstError.msg)))
		return false
	}
	return true
}

