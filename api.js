'use strict';

module.exports = {
  async getTestConnection({ homey }) {
    return await homey.app.testConnection();
  }
};
