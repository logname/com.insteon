'use strict';

const Homey = require('homey');

class InsteonDimmerDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Insteon Dimmer device initialized');

    const settings = this.getSettings();
    this.deviceID = settings.deviceID;
    this.dimmable = settings.dimmable !== false;
    this.fastCommands = settings.fastCommands === true;

    // ALWAYS register capability listeners (even if not configured yet)
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    
    if (this.hasCapability('dim')) {
      this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    }

    // Check if device is configured
    if (!this.deviceID || this.deviceID === '') {
      this.setUnavailable(this.homey.__('device.not_configured')).catch(this.error);
      this.log('Device not yet configured - deviceID missing');
      return; // Don't register with app or refresh state
    }

    // Register with app
    const app = this.homey.app;
    app.registerDevice(this);

    // Set as available
    this.setAvailable().catch(this.error);

    // Query initial state
    await this.refreshState();
  }

  /**
   * Handle on/off capability changes
   * Uses direct HTTP to hub for fast response
   */
  async onCapabilityOnoff(value) {
    this.log(`Setting onoff to ${value}`);
    
    // Check if device is configured
    if (!this.deviceID || this.deviceID === '') {
      throw new Error(this.homey.__('device.not_configured'));
    }
    
    const app = this.homey.app;
    
    if (!app.isConnectedToHub()) {
      throw new Error(this.homey.__('errors.hub_not_connected'));
    }

    try {
      // Send direct HTTP command to hub for instant response
      const cmd = value ? (this.fastCommands ? '12' : '11') : (this.fastCommands ? '14' : '13');
      const level = value ? 'FF' : '00';
      
      await this.sendDirectCommand(cmd, level);

      // Update dim level if turning on
      if (value && this.hasCapability('dim')) {
        this.setCapabilityValue('dim', 1).catch(this.error);
      } else if (!value && this.hasCapability('dim')) {
        this.setCapabilityValue('dim', 0).catch(this.error);
      }

      return true;
    } catch (error) {
      this.error('Failed to set onoff:', error);
      throw new Error(this.homey.__('errors.command_failed'));
    }
  }

  /**
   * Handle dim capability changes
   * Uses direct HTTP to hub for fast, smooth dimming
   */
  async onCapabilityDim(value) {
    this.log(`Setting dim level to ${value}`);

    // Check if device is configured
    if (!this.deviceID || this.deviceID === '') {
      throw new Error(this.homey.__('device.not_configured'));
    }

    const app = this.homey.app;

    if (!app.isConnectedToHub()) {
      throw new Error(this.homey.__('errors.hub_not_connected'));
    }

    try {
      // Convert 0-1 range to 0-255 for Insteon
      const insteonLevel = Math.round(value * 255);
      const hexLevel = insteonLevel.toString(16).padStart(2, '0').toUpperCase();
      
      // Send direct HTTP command (11 = ON with level)
      await this.sendDirectCommand('11', hexLevel);

      // Update onoff based on level
      const isOn = value > 0;
      if (this.getCapabilityValue('onoff') !== isOn) {
        this.setCapabilityValue('onoff', isOn).catch(this.error);
      }

      return true;
    } catch (error) {
      this.error('Failed to set dim level:', error);
      throw new Error(this.homey.__('errors.command_failed'));
    }
  }

  /**
   * Turn on using fast command
   */
  async turnOnFast() {
    this.log('Turning on (fast)');

    const app = this.homey.app;
    const hub = app.getHub();

    if (!hub || !app.isConnectedToHub()) {
      throw new Error(this.homey.__('errors.hub_not_connected'));
    }

    try {
      await hub.light(this.deviceID).turnOnFast();
      
      this.setCapabilityValue('onoff', true).catch(this.error);
      if (this.hasCapability('dim')) {
        this.setCapabilityValue('dim', 1).catch(this.error);
      }
    } catch (error) {
      this.error('Failed to turn on fast:', error);
      throw new Error(this.homey.__('errors.command_failed'));
    }
  }

  /**
   * Turn off using fast command
   */
  async turnOffFast() {
    this.log('Turning off (fast)');

    const app = this.homey.app;
    const hub = app.getHub();

    if (!hub || !app.isConnectedToHub()) {
      throw new Error(this.homey.__('errors.hub_not_connected'));
    }

    try {
      await hub.light(this.deviceID).turnOffFast();
      
      this.setCapabilityValue('onoff', false).catch(this.error);
      if (this.hasCapability('dim')) {
        this.setCapabilityValue('dim', 0).catch(this.error);
      }
    } catch (error) {
      this.error('Failed to turn off fast:', error);
      throw new Error(this.homey.__('errors.command_failed'));
    }
  }

  /**
   * Refresh device state from hub
   */
  async refreshState() {
    const app = this.homey.app;
    const hub = app.getHub();

    if (!hub || !app.isConnectedToHub()) {
      this.log('Cannot refresh state - hub not connected');
      return;
    }

    try {
      const level = await hub.light(this.deviceID).level();
      const normalizedLevel = level / 100; // Convert to 0-1 range
      
      this.log(`Refreshed state: level=${level}%`);

      if (this.hasCapability('dim')) {
        this.setCapabilityValue('dim', normalizedLevel).catch(this.error);
      }
      this.setCapabilityValue('onoff', level > 0).catch(this.error);
    } catch (error) {
      this.error('Failed to refresh state:', error);
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Insteon Dimmer device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Settings were changed:', changedKeys);
    
    const app = this.homey.app;
    app.debugLog(`Device settings changed: ${this.getName()}`);
    app.debugLog(`  Changed keys: ${changedKeys.join(', ')}`);

    if (changedKeys.includes('deviceID')) {
      const oldID = oldSettings.deviceID;
      const newID = newSettings.deviceID;
      
      app.debugLog(`  deviceID changed: "${oldID}" → "${newID}"`);
      
      this.deviceID = newSettings.deviceID;
      
      if (this.deviceID && this.deviceID !== '') {
        // Device is now configured
        this.log('Device configured with ID:', this.deviceID);
        app.debugLog(`  Registering device with Insteon ID: ${this.deviceID}`);
        
        // Register with app - PASS newSettings so it has the new deviceID!
        app.registerDevice(this, newSettings);
        
        // Mark as available
        await this.setAvailable();
        app.debugLog(`  Device marked as available`);
        
        // Refresh state
        await this.refreshState();
      } else {
        // Device ID removed
        app.debugLog(`  Device ID removed, marking as unavailable`);
        await this.setUnavailable(this.homey.__('device.not_configured'));
      }
    }

    if (changedKeys.includes('dimmable')) {
      this.dimmable = newSettings.dimmable;
    }

    if (changedKeys.includes('fastCommands')) {
      this.fastCommands = newSettings.fastCommands;
    }
  }

  /**
   * onRenamed is called when the user updates the device's name.
   */
  async onRenamed(name) {
    this.log(`Device was renamed to ${name}`);
  }

  /**
   * Send direct HTTP command to Insteon hub
   * Much faster than going through home-controller
   */
  async sendDirectCommand(cmd, level) {
    this.log('=== sendDirectCommand START ===');
    this.log(`Device ID: ${this.deviceID}`);
    this.log(`Command: ${cmd}, Level: ${level}`);
    
    try {
      // Get hub settings
      const hubHost = this.homey.settings.get('hubHost');
      const hubPort = this.homey.settings.get('hubPort') || 25105;
      const hubUser = this.homey.settings.get('hubUser') || '';
      const hubPass = this.homey.settings.get('hubPass') || '';
      const hubModel = this.homey.settings.get('hubModel') || '2245';

      this.log('Hub settings loaded:', {
        host: hubHost,
        port: hubPort,
        model: hubModel,
        user: hubUser ? '***' : 'NOT SET',
        pass: hubPass ? '***' : 'NOT SET'
      });

      if (!hubHost) {
        this.error('Hub IP not configured!');
        throw new Error('Hub not configured in app settings. Please configure hub IP address.');
      }
      
      // Check credentials requirement based on hub model
      if (hubModel === '2245' && (!hubUser || !hubPass)) {
        this.error('Hub 2245 requires credentials!');
        throw new Error('Hub 2245 requires username and password in app settings.');
      }

      // Build URL - NOTE: Must end with dash!
      // For 2242 without credentials, omit the user:pass@ part
      let url, safeUrl;
      if (hubUser && hubPass) {
        url = `http://${hubUser}:${hubPass}@${hubHost}:${hubPort}/3?0262${this.deviceID}0F${cmd}${level}=I=3-`;
        safeUrl = `http://***:***@${hubHost}:${hubPort}/3?0262${this.deviceID}0F${cmd}${level}=I=3-`;
      } else {
        url = `http://${hubHost}:${hubPort}/3?0262${this.deviceID}0F${cmd}${level}=I=3-`;
        safeUrl = `http://${hubHost}:${hubPort}/3?0262${this.deviceID}0F${cmd}${level}=I=3-`;
      }
      this.log('URL:', safeUrl);

      // Try using node-fetch style
      this.log('Attempting HTTP request...');
      
      const https = require('https');
      const http = require('http');
      
      return await new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {},
          timeout: 5000
        };
        
        // Only add auth header if credentials provided
        if (hubUser && hubPass) {
          options.headers['Authorization'] = 'Basic ' + Buffer.from(`${hubUser}:${hubPass}`).toString('base64');
        }

        this.log('HTTP options:', {
          hostname: options.hostname,
          port: options.port,
          path: options.path
        });

        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
          this.log(`HTTP response status: ${res.statusCode}`);
          
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            this.log('HTTP response received, length:', data.length);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              this.log('Command sent successfully!');
              resolve({ statusCode: res.statusCode, data });
            } else {
              this.error(`HTTP error ${res.statusCode}`);
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          this.error('HTTP request error:', error.message);
          reject(error);
        });

        req.on('timeout', () => {
          this.error('HTTP request timeout');
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
      
    } catch (error) {
      this.error('=== sendDirectCommand ERROR ===');
      this.error('Error type:', error.constructor.name);
      this.error('Error message:', error.message);
      this.error('Error stack:', error.stack);
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Insteon Dimmer device has been deleted');
    
    // Unregister from app
    const app = this.homey.app;
    app.unregisterDevice(this);
  }

}

module.exports = InsteonDimmerDevice;
