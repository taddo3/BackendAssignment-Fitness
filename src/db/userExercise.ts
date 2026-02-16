import {
	Sequelize,
	DataTypes,
	Model
} from 'sequelize'

import { ExerciseModel } from './exercise'
import { UserModel } from './user'

export interface UserExerciseModel extends Model {
	id: number
	userID: number
	exerciseID: number
	completedAt: Date
	durationSeconds: number

	user?: UserModel
	exercise?: ExerciseModel
}

export default (sequelize: Sequelize, modelName: string) => {
	const UserExerciseModelCtor = sequelize.define<UserExerciseModel>(
		modelName,
		{
			id: {
				type: DataTypes.BIGINT,
				primaryKey: true,
				allowNull: false,
				autoIncrement: true
			},
			userID: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			exerciseID: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			completedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			},
			durationSeconds: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		},
		{
			paranoid: true,
			timestamps: true,
			tableName: 'user_exercises'
		}
	)

	UserExerciseModelCtor.associate = (models) => {
		UserExerciseModelCtor.belongsTo(models.User, {
			as: 'user',
			foreignKey: {
				name: 'userID',
				allowNull: false
			}
		})

		UserExerciseModelCtor.belongsTo(models.Exercise, {
			as: 'exercise',
			foreignKey: {
				name: 'exerciseID',
				allowNull: false
			}
		})
	}

	return UserExerciseModelCtor
}

