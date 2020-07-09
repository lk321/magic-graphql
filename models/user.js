module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING(65),
            allowNull: false
        },
        full_name: {
            type: DataTypes.VIRTUAL,
            get: function () { return `${this.name} - ${this.last_name}` }
        },
        email: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(120),
            allowNull: false,
            defaultValue: 'Generic pswd'
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'user'
    })
}
