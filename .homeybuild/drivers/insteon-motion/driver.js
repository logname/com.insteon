'use strict';

const Homey = require('homey');

class InsteonDriver extends Homey.Driver {

  async onInit() {
    this.log(`${this.id} driver has been initialized`);
  }

  async onPairListDevices() {
    this.log('Listing placeholder device for pairing...');
    
    return [{
      name: this.homey.__(`drivers.${this.id}.pair.placeholder_name`),
      data: {
        id: this.generateUID()
      },
      settings: {
        deviceID: '',
        fastCommands: false
      }
    }];
  }

  generateUID() {
    return `${this.id}-` + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

}

module.exports = InsteonDriver;
