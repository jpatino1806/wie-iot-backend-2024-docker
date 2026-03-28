'use strict';
const {
	Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class devices extends Model {
		
		static associate(models) {
			// define association here
		}
	};
	devices.init({
		user_id: DataTypes.INTEGER,
		name: DataTypes.STRING,
		key: DataTypes.STRING,
		active: DataTypes.BOOLEAN
	}, {
		sequelize,
		modelName: 'Device',
		tableName: 'devices',
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
	return devices;
};