import fs from 'fs'
import { Sequelize } from 'sequelize'
import { logError } from '../utils/logger'

import defineExercise from './exercise'
import defineProgram from './program'
import defineUser from './user'
import defineUserExercise from './userExercise'

const sequelize: Sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/fitness_app', {
	logging: false
})

sequelize.authenticate().catch((e: any) => {
	logError(e, 'Unable to connect to the database')
})

const Exercise = defineExercise(sequelize, 'exercise')
const Program = defineProgram(sequelize, 'program')
const User = defineUser(sequelize, 'user')
const UserExercise = defineUserExercise(sequelize, 'userExercise')

const models = {
	Exercise,
	Program,
	User,
	UserExercise
}
type Models = typeof models

// check if every model is imported
const modelsFiles = fs.readdirSync(__dirname)
// -1 because index.ts can not be counted
if (Object.keys(models).length !== (modelsFiles.length - 1)) {
	throw new Error('You probably forgot import database model!')
}

Object.values(models).forEach((value: any) => {
	if (value.associate) {
		value.associate(models)
	}
})

/**
 * Create optimized indexes for full-text search
 * This creates a GIN trigram index for better ILIKE query performance
 */
export const createSearchIndexes = async () => {
	try {
		// Enable pg_trgm extension if not already enabled (PostgreSQL only)
		await sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;')
		
		// Create GIN index on exercises.name using trigrams for ILIKE queries
		// This significantly improves performance for pattern matching queries like '%search%'
		await sequelize.query(`
			CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx 
			ON exercises USING gin (name gin_trgm_ops);
		`)
		
		console.log('Search indexes created successfully')
	} catch (error) {
		// If pg_trgm extension is not available or index creation fails,
		// the B-tree index will still be used
		console.warn('Could not create trigram index for exercises.name. B-tree index will be used instead.')
	}
}

export { models, sequelize }
export type { Models }
