import { Request } from 'express'
import { en } from '../locales/en'
import { sk } from '../locales/sk'

export type SupportedLanguage = 'en' | 'sk'

const translations: Record<SupportedLanguage, Record<string, string>> = {
	en,
	sk
}

const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

export interface LocalizedRequest extends Request {
	language?: SupportedLanguage
}

/**
 * Get the language from request headers
 * Defaults to 'en' if not specified or invalid
 */
export const getLanguageFromRequest = (req: Request): SupportedLanguage => {
	const languageHeader = typeof req.headers.language === 'string' ? req.headers.language.toLowerCase() : undefined

	if (languageHeader === 'en' || languageHeader === 'sk') {
		return languageHeader as SupportedLanguage
	}
	
	return DEFAULT_LANGUAGE
}

/**
 * Translate a message key to the specified language
 * Falls back to the key itself if translation is not found
 */
export const translate = (key: string, language: SupportedLanguage = DEFAULT_LANGUAGE): string => {
	const translation = translations[language]?.[key]
	return translation || key
}

/**
 * Get translation for a request
 */
export const t = (req: LocalizedRequest, key: string): string => {
	const language = req.language || DEFAULT_LANGUAGE
	return translate(key, language)
}
