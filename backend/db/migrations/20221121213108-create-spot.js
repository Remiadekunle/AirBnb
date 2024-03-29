'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Spots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      address: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      lat: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      lng: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      beds:{
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      baths:{
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      guests: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isTrendy: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      formattedAddres: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, options);
  },
  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Spots'
    return queryInterface.dropTable(options, options);
  }
};
