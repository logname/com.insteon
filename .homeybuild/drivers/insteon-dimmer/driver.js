'use strict';

const Homey = require('homey');

class InsteonDimmerDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Insteon Dimmer driver has been initialized');
  }

  /**
   * onPairListDevices is called when the user initiates pairing
   * Returns a placeholder device that will be configured via repair flow
   */
  async onPairListDevices() {
    this.log('Listing placeholder device for pairing...');
    
    // Return a single placeholder device
    // User will configure the actual Insteon ID via device settings after pairing
    return [{
      name: this.homey.__('drivers.insteon-dimmer.pair.placeholder_name'),
      data: {
        id: this.generateUID()
      },
      settings: {
        deviceID: '',
        dimmable: true,
        fastCommands: false
      }
    }];
  }

  /**
   * Generate a unique ID for the device
   */
  generateUID() {
    return 'insteon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

}

module.exports = InsteonDimmerDriver;
