'use strict';

const { Device } = require('homey');

class InsteonSceneDevice extends Device {

  async onInit() {
    this.log('InsteonSceneDevice has been initialized');

    // Get the Insteon app
    this.insteonApp = this.homey.app;

    // Register capability listeners
    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    // Get settings
    const settings = this.getSettings();
    const sceneNumber = settings.sceneNumber;

    if (sceneNumber) {
      this.log(`Scene ${sceneNumber} initialized`);
      this.setAvailable();
    } else {
      this.log('Scene number not configured');
      this.setUnavailable('Configure scene number in settings');
    }
  }

  async onCapabilityOnOff(value) {
    this.log(`Scene ${value ? 'ON' : 'OFF'} triggered`);

    const settings = this.getSettings();
    const sceneNumber = settings.sceneNumber;
    const fastCommands = settings.fastCommands || false;

    if (!sceneNumber) {
      throw new Error('Scene number not configured');
    }

    // Pad scene number to 2 digits
    const scenePadded = sceneNumber.toString().padStart(2, '0');

    // Determine command based on state and fast setting
    let command;
    if (value) {
      // Turn ON
      command = fastCommands ? `12${scenePadded}` : `11${scenePadded}`;
    } else {
      // Turn OFF
      command = fastCommands ? `14${scenePadded}` : `13${scenePadded}`;
    }

    this.log(`Sending scene command: ${command} (${value ? 'ON' : 'OFF'}${fastCommands ? ' FAST' : ''})`);

    // Send command via app
    await this.insteonApp.sendSceneCommand(command);

    return true;
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Scene settings changed');
    this.log('  Changed keys:', changedKeys);
    this.log('  Scene number changed:', oldSettings.sceneNumber, '→', newSettings.sceneNumber);

    if (changedKeys.includes('sceneNumber')) {
      if (newSettings.sceneNumber) {
        this.log(`  Scene configured: ${newSettings.sceneNumber}`);
        this.setAvailable();
      } else {
        this.log('  Scene number removed');
        this.setUnavailable('Configure scene number in settings');
      }
    }
  }

  async onDeleted() {
    this.log('Scene has been deleted');
  }

}

module.exports = InsteonSceneDevice;
