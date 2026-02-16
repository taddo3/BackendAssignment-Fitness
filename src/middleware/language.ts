import {
	Request,
	Response,
	NextFunction
} from 'express'
import { getLanguageFromRequest, LocalizedRequest } from '../utils/localization'

/**
 * Middleware to extract language from HTTP header and attach to request
 * Supports 'language' header with values 'en' or 'sk'
 * Defaults to 'en' if not specified or invalid
 */
export const languageMiddleware = (req: LocalizedRequest, _res: Response, next: NextFunction) => {
	req.language = getLanguageFromRequest(req)
	next()
}
