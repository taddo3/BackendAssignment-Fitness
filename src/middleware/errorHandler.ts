import {
	Request,
	Response,
	NextFunction
} from 'express'
import { logError } from '../utils/logger'
import { buildResponse } from '../utils/http'
import { LocalizedRequest } from '../utils/localization'

/**
 * Global error handler middleware
 * Catches all errors and ensures users never see stack traces or real error messages
 */
export const errorHandler = (
	err: Error | unknown,
	req: Request,
	res: Response,
	_next: NextFunction
): void => {
	// Log error with full details (internal only)
	logError(err, 'Unhandled error in request', {
		req: {
			method: req.method,
			url: req.url,
			headers: req.headers,
			body: req.body,
			params: req.params,
			query: req.query
		}
	})
	
	// Return generic error to user (never expose stack trace or real error)
	const localizedReq = req as LocalizedRequest
	res.status(500).json(buildResponse(localizedReq, {}, 'Something went wrong'))
}
