'use strict';

const Homey = require('homey');

class InsteonContactDevice extends Homey.Device {

  async onInit() {
    this.log('Insteon Contact Sensor device initialized');

    const settings = this.getSettings();
    this.deviceID = settings.deviceID;

    const app = this.homey.app;
    app.registerDevice(this);
  }

  async onAdded() {
    this.log('Insteon Contact Sensor device has been added');
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    const app = this.homey.app;
    app.debugLog(`Contact sensor settings changed: ${this.getName()}`);
    app.debugLog(`  Changed keys: ${changedKeys.join(', ')}`);
    
    if (changedKeys.includes('deviceID')) {
      const oldID = oldSettings.deviceID;
      const newID = newSettings.deviceID;
      
      app.debugLog(`  deviceID changed: "${oldID}" → "${newID}"`);
      
      this.deviceID = newSettings.deviceID;
      
      if (this.deviceID && this.deviceID !== '') {
        this.log('Contact sensor configured with ID:', this.deviceID);
        app.debugLog(`  Registering contact sensor with Insteon ID: ${this.deviceID}`);
        
        // Re-register with app - PASS newSettings!
        app.unregisterDevice(this);
        app.registerDevice(this, newSettings);
        
        // Mark as available
        await this.setAvailable();
        app.debugLog(`  Contact sensor marked as available`);
      } else {
        app.debugLog(`  Device ID removed, marking as unavailable`);
        await this.setUnavailable(this.homey.__('device.not_configured'));
      }
    }
  }

  async onDeleted() {
    this.log('Insteon Contact Sensor device has been deleted');
    const app = this.homey.app;
    app.unregisterDevice(this);
  }

}

module.exports = InsteonContactDevice;
