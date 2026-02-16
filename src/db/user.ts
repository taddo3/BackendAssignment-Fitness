import { Sequelize, DataTypes, Model, Optional } from 'sequelize'

import { USER_ROLE } from '../utils/enums'

interface UserAttributes {
  id: number
  name: string
  surname: string
  nickName: string
  email: string
  age: number
  role: USER_ROLE
  passwordHash: string
}

type UserCreationAttributes = Optional<UserAttributes, 'id'>

export interface UserModel
  extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

export default (sequelize: Sequelize, modelName: string) => {
  const UserModelCtor = sequelize.define<UserModel>(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      nickName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      role: {
        type: DataTypes.ENUM(...Object.values(USER_ROLE)),
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      }
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: 'users',
    }
  )

  return UserModelCtor
}
