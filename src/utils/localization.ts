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
 * Replace placeholders in a string with actual values
 */
const replacePlaceholders = (template: string, params: Record<string, string | number>): string => {
	let result = template
	for (const [key, value] of Object.entries(params)) {
		const placeholder = `{${key}}`
		result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value))
	}
	return result
}

/**
 * Translate a message key to the specified language
 * Falls back to the key itself if translation is not found
 * Supports placeholders like {fieldName}, {min}, {max}
 */
export const translate = (
	key: string,
	language: SupportedLanguage = DEFAULT_LANGUAGE,
	params?: Record<string, string | number>
): string => {
	const translation = translations[language]?.[key] || key
	
	if (params && Object.keys(params).length > 0) {
		return replacePlaceholders(translation, params)
	}
	
	return translation
}

/**
 * Get translation for a request
 * Supports placeholders like {fieldName}, {min}, {max}
 */
export const t = (req: LocalizedRequest, key: string, params?: Record<string, string | number>): string => {
	const language = req.language || DEFAULT_LANGUAGE
	return translate(key, language, params)
}
