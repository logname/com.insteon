'use strict';

const Homey = require('homey');
const Insteon = require('home-controller').Insteon;
const WebSocket = require('ws');

class InsteonApp extends Homey.App {
  
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Insteon for Homey app is running...');

    // Initialize state
    this.hub = null;
    this.wss = null;
    this.connectedToHub = false;
    this.connectingToHub = false;
    this.reconnectDelay = 1;
    this.devices = new Map();
    this.devicesMapId = Math.random().toString(36).substr(2, 9); // Unique ID to track this Map
    this.wsClients = new Set();

    this.log(`Created devices Map with ID: ${this.devicesMapId}`);
    this.debugLog(`========================================`);
    this.debugLog(`APP INITIALIZED`);
    this.debugLog(`  Devices Map ID: ${this.devicesMapId}`);
    this.debugLog(`  Map size: ${this.devices.size}`);
    this.debugLog(`========================================`);

    // Get app settings
    this.settings = this.homey.settings;
    
    // Initialize hub connection
    await this.initializeHub();

    // Initialize WebSocket server
    await this.initializeWebSocketServer();

    // Register flow cards
    this.registerFlowCards();

    // Listen for settings changes
    this.settings.on('set', (key) => {
      this.log(`Setting changed: ${key}`);
      if (['hubHost', 'hubPort', 'hubUser', 'hubPass', 'hubModel'].includes(key)) {
        this.reconnectToHub();
      }
    });

    this.log('Insteon app initialized successfully');
  }

  /**
   * Log debug message to settings page if debug logging is enabled
   */
  debugLog(message) {
    const debugEnabled = this.homey.settings.get('debugLogging');
    if (debugEnabled) {
      // Get existing log
      let logMessages = this.homey.settings.get('debugLog') || [];
      
      // Add timestamp and message
      const timestamp = new Date().toISOString().substr(11, 12);
      const logEntry = `[${timestamp}] ${message}`;
      
      // Add to array
      logMessages.push(logEntry);
      
      // Keep last 1000 messages
      if (logMessages.length > 1000) {
        logMessages = logMessages.slice(-1000);
      }
      
      // Save back to settings
      this.homey.settings.set('debugLog', logMessages);
      
      // Also log to console
      this.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * Initialize connection to Insteon hub
   */
  async initializeHub() {
    const hubHost = this.settings.get('hubHost');
    const hubPort = this.settings.get('hubPort') || '25105';
    const hubUser = this.settings.get('hubUser');
    const hubPass = this.settings.get('hubPass');
    const hubModel = this.settings.get('hubModel') || '2245';

    if (!hubHost || !hubUser || !hubPass) {
      this.log('Hub credentials not configured. Waiting for setup...');
      return;
    }

    this.log(`Connecting to Insteon Hub ${hubModel} at ${hubHost}:${hubPort}...`);

    try {
      this.hub = new Insteon();
      this.connectingToHub = true;

      const hubConfig = {
        host: hubHost,
        port: parseInt(hubPort),
        user: hubUser,
        password: hubPass
      };

      if (hubModel === '2245') {
        await new Promise((resolve, reject) => {
          this.hub.httpClient(hubConfig, (err) => {
            if (err) {
              reject(err);
            } else {
              this.log('Connected to Insteon Model 2245 Hub');
              this.connectedToHub = true;
              this.connectingToHub = false;
              this.reconnectDelay = 1; // Reset reconnect delay on success
              resolve();
            }
          });
        });
      } else if (hubModel === '2242') {
        await new Promise((resolve, reject) => {
          this.hub.connect(hubHost, (err) => {
            if (err) {
              reject(err);
            } else {
              this.log('Connected to Insteon Model 2242 Hub');
              this.connectedToHub = true;
              this.connectingToHub = false;
              this.reconnectDelay = 1;
              resolve();
            }
          });
        });
      }

      // Start event listener
      this.startEventListener();
      
    } catch (error) {
      this.error('Failed to connect to Insteon Hub:', error);
      this.connectedToHub = false;
      this.connectingToHub = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection to hub
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff with max delay of 5 minutes
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 300);
    
    this.log(`Scheduling reconnect in ${this.reconnectDelay} seconds...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.initializeHub();
    }, this.reconnectDelay * 1000);
  }

  /**
   * Force reconnection to hub
   */
  async reconnectToHub() {
    this.log('Reconnecting to Insteon Hub...');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectDelay = 1;
    await this.initializeHub();
  }

  /**
   * Start listening for Insteon events
   */
  startEventListener() {
    if (!this.hub) return;

    this.log('Starting Insteon event listener...');

    this.hub.on('command', (data) => {
      if (!data.standard) return;

      const { id, command1, command2, messageType, gatewayId, raw } = data.standard;
      const deviceId = id.toUpperCase();

      this.debugLog('========================================');
      this.debugLog('INSTEON EVENT RECEIVED');
      this.debugLog(`  Devices Map ID: ${this.devicesMapId || 'UNDEFINED!'}`);
      this.debugLog(`Device ID: ${deviceId}`);
      this.debugLog(`Command1: ${command1} (0x${command1}, decimal: ${parseInt(command1, 16)})`);
      this.debugLog(`Command2: ${command2} (0x${command2}, decimal: ${parseInt(command2, 16)})`);
      this.debugLog(`Message Type: ${messageType}`);
      this.debugLog(`  Checking Map for device...`);
      this.debugLog(`  Map size: ${this.devices.size}`);
      this.debugLog(`  Map keys: [${Array.from(this.devices.keys()).join(', ')}]`);
      this.debugLog(`  Looking for: ${deviceId}`);
      this.debugLog(`  Map.has("${deviceId}"): ${this.devices.has(deviceId)}`);

      // Find device by Insteon deviceID
      const device = this.devices.get(deviceId);
      
      if (!device) {
        this.debugLog(`❌ No registered device found for Insteon ID ${deviceId}`);
        this.debugLog(`Registered device IDs: [${Array.from(this.devices.keys()).join(', ')}]`);
        this.debugLog('========================================');
        return;
      }

      const deviceType = device.driver.id;
      
      this.debugLog(`✅ Found device: ${device.getName()} (${deviceType})`);

      switch (deviceType) {
        case 'insteon-dimmer':
        case 'insteon-switch':
          this.debugLog(`Calling handleLightEvent...`);
          this.handleLightEvent(device, command1, command2, messageType);
          break;
        case 'insteon-contact':
          this.debugLog(`Calling handleContactEvent...`);
          this.handleContactEvent(device, command1, command2);
          break;
        case 'insteon-leak':
          this.debugLog(`Calling handleLeakEvent...`);
          this.handleLeakEvent(device, command1, command2);
          break;
        case 'insteon-motion':
          this.debugLog(`Calling handleMotionEvent...`);
          this.handleMotionEvent(device, command1, command2);
          break;
      }

      // Broadcast to WebSocket clients
      this.broadcastDeviceState(device, deviceId, command2);
      
      this.debugLog('========================================');
    });
  }

  /**
   * Handle light/dimmer events
   */
  handleLightEvent(device, command1, command2, messageType) {
    const cmd1 = parseInt(command1, 16);
    const cmd2Hex = command2;

    this.debugLog(`handleLightEvent called`);
    this.debugLog(`  cmd1: 0x${command1} (${cmd1})`);
    this.debugLog(`  cmd2: 0x${cmd2Hex} (${parseInt(cmd2Hex, 16)})`);
    this.debugLog(`  messageType: ${messageType}`);

    // Status request response or direct messages
    if (cmd1 === 0x19 || cmd1 === 0x03 || cmd1 === 0x04 || 
        (cmd1 === 0x00 && cmd2Hex !== '00') || 
        (cmd1 === 0x06 && messageType === '1')) {
      
      const levelInt = parseInt(cmd2Hex, 16) * (100 / 255);
      const level = Math.ceil(levelInt) / 100; // Homey uses 0-1 range

      this.debugLog(`  Status update: level=${level.toFixed(2)} (${level > 0 ? 'ON' : 'OFF'})`);
      
      if (device.hasCapability('dim')) {
        this.debugLog(`  Setting dim capability to ${level.toFixed(2)}`);
        device.setCapabilityValue('dim', level).catch(this.error);
      }
      this.debugLog(`  Setting onoff capability to ${level > 0}`);
      device.setCapabilityValue('onoff', level > 0).catch(this.error);
    }
    // ON command
    else if (cmd1 === 0x11) {
      const levelInt = parseInt(cmd2Hex, 16) * (100 / 255);
      const level = Math.ceil(levelInt) / 100;

      this.debugLog(`  ON command: level=${level.toFixed(2)}`);
      
      if (device.hasCapability('dim')) {
        this.debugLog(`  Setting dim capability to ${level.toFixed(2)}`);
        device.setCapabilityValue('dim', level).catch(this.error);
      }
      this.debugLog(`  Setting onoff capability to true`);
      device.setCapabilityValue('onoff', true).catch(this.error);
    }
    // Fast ON
    else if (cmd1 === 0x12) {
      this.debugLog(`  FastON command`);
      
      if (device.hasCapability('dim')) {
        this.debugLog(`  Setting dim capability to 1.00`);
        device.setCapabilityValue('dim', 1).catch(this.error);
      }
      this.debugLog(`  Setting onoff capability to true`);
      device.setCapabilityValue('onoff', true).catch(this.error);
    }
    // OFF or Fast OFF
    else if (cmd1 === 0x13 || cmd1 === 0x14) {
      this.debugLog(`  ${cmd1 === 0x14 ? 'Fast' : 'Normal'} OFF command`);
      
      if (device.hasCapability('dim')) {
        this.debugLog(`  Setting dim capability to 0.00`);
        device.setCapabilityValue('dim', 0).catch(this.error);
      }
      this.debugLog(`  Setting onoff capability to false`);
      device.setCapabilityValue('onoff', false).catch(this.error);
    }
    // Manual brighten (press and hold to brighten)
    else if (cmd1 === 0x17) {
      this.debugLog(`  Start manual brighten command (user holding button)`);
      // No action needed - just informational
      // When they release, we'll get 0x18 (stop) and query the level
    }
    // Manual dim (press and hold to dim)
    else if (cmd1 === 0x16) {
      this.debugLog(`  Start manual dim command (user holding button)`);
      // No action needed - just informational  
      // When they release, we'll get 0x18 (stop) and query the level
    }
    // Stop dimming - query current level
    else if (cmd1 === 0x18) {
      this.debugLog(`  Stop manual dimming command - querying level`);
      
      const settings = device.getSettings();
      const insteonID = settings.deviceID;
      
      if (insteonID) {
        this.hub.light(insteonID).level().then(level => {
          const normalizedLevel = level / 100;
          this.debugLog(`  Queried level: ${normalizedLevel.toFixed(2)}`);
          if (device.hasCapability('dim')) {
            device.setCapabilityValue('dim', normalizedLevel).catch(this.error);
          }
          device.setCapabilityValue('onoff', level > 0).catch(this.error);
        }).catch(this.error);
      }
    }
    else {
      this.debugLog(`  ⚠️  Unhandled command: 0x${command1}`);
    }
  }

  /**
   * Handle contact sensor events
   */
  handleContactEvent(device, command1, command2) {
    const cmd1 = parseInt(command1, 16);
    
    this.debugLog(`handleContactEvent called`);
    this.debugLog(`  cmd1: 0x${command1} (${cmd1})`);
    this.debugLog(`  cmd2: 0x${command2}`);
    
    // Contact sensors use cmd1 for state:
    // 0x11 = OPEN
    // 0x13 = CLOSED
    // 0x06 = Heartbeat (ignore)
    if (cmd1 === 0x11) {
      this.debugLog(`  Contact sensor OPENED`);
      device.setCapabilityValue('alarm_contact', true).catch(this.error); // true = open
    } else if (cmd1 === 0x13) {
      this.debugLog(`  Contact sensor CLOSED`);
      device.setCapabilityValue('alarm_contact', false).catch(this.error); // false = closed
    } else if (cmd1 === 0x06) {
      this.debugLog(`  Contact sensor heartbeat (ignored)`);
      // Don't change state
    } else {
      this.debugLog(`  ⚠️  Unhandled contact sensor command: 0x${command1}`);
    }
  }

  /**
   * Handle leak sensor events
   */
  handleLeakEvent(device, command1, command2) {
    const cmd1 = parseInt(command1, 16);
    const cmd2 = parseInt(command2, 16);
    
    this.debugLog(`handleLeakEvent called`);
    this.debugLog(`  cmd1: 0x${command1} (${cmd1})`);
    this.debugLog(`  cmd2: 0x${command2} (${cmd2})`);
    
    // Leak sensors use cmd1=0x11 with cmd2 to indicate state:
    // cmd2=0x02 (2) = WET
    // cmd2=0x01 (1) = DRY  
    // cmd1=0x06 = Heartbeat (ignore)
    if (cmd1 === 0x11 && cmd2 === 0x02) {
      this.debugLog(`  Leak sensor detected WATER (wet) - cmd2=0x02`);
      device.setCapabilityValue('alarm_water', true).catch(this.error);
    } else if (cmd1 === 0x11 && cmd2 === 0x01) {
      this.debugLog(`  Leak sensor DRY (no leak) - cmd2=0x01`);
      device.setCapabilityValue('alarm_water', false).catch(this.error);
    } else if (cmd1 === 0x06) {
      this.debugLog(`  Leak sensor heartbeat (ignored - alarm stays in current state)`);
      // Don't change alarm state
    } else if (cmd1 === 0x13) {
      this.debugLog(`  Leak sensor OFF command (dry)`);
      device.setCapabilityValue('alarm_water', false).catch(this.error);
    } else {
      this.debugLog(`  ⚠️  Unhandled leak sensor command: cmd1=0x${command1}, cmd2=0x${command2}`);
    }
  }

  /**
   * Handle motion sensor events
   */
  handleMotionEvent(device, command1, command2) {
    const cmd1 = parseInt(command1, 16);
    
    this.debugLog(`handleMotionEvent called`);
    this.debugLog(`  cmd1: 0x${command1} (${cmd1})`);
    this.debugLog(`  cmd2: 0x${command2}`);
    
    // Motion sensors use cmd1 for state (same as contact sensors):
    // 0x11 = ACTIVE (motion detected)
    // 0x13 = INACTIVE (no motion)
    // 0x06 = Heartbeat (ignore)
    if (cmd1 === 0x11) {
      this.debugLog(`  Motion sensor ACTIVE (motion detected)`);
      device.setCapabilityValue('alarm_motion', true).catch(this.error); // true = active/motion detected
    } else if (cmd1 === 0x13) {
      this.debugLog(`  Motion sensor INACTIVE (no motion)`);
      device.setCapabilityValue('alarm_motion', false).catch(this.error); // false = inactive/no motion
    } else if (cmd1 === 0x06) {
      this.debugLog(`  Motion sensor heartbeat (ignored)`);
      // Don't change state
    } else {
      this.debugLog(`  ⚠️  Unhandled motion sensor command: 0x${command1}`);
    }
  }

  /**
   * Broadcast device state to WebSocket clients
   */
  broadcastDeviceState(device, deviceId, command2) {
    const message = {
      name: device.getName(),
      id: deviceId,
      deviceType: device.driver.id,
      state: device.getCapabilityValue('onoff') ? 
        (device.hasCapability('dim') ? Math.round(device.getCapabilityValue('dim') * 100) : 100) : 0
    };

    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Initialize WebSocket server for compatibility
   */
  async initializeWebSocketServer() {
    const wsPort = this.settings.get('wsPort') || 8080;
    
    try {
      this.wss = new WebSocket.Server({ port: wsPort });
      
      this.wss.on('connection', (ws) => {
        this.log('WebSocket client connected');
        this.wsClients.add(ws);
        ws.isAlive = true;

        ws.send('Connected to Insteon Server');

        ws.on('close', () => {
          this.log('WebSocket client disconnected');
          this.wsClients.delete(ws);
        });

        ws.on('message', (message) => {
          if (message.toString() === 'getDevices') {
            const deviceList = Array.from(this.devices.values()).map(device => ({
              name: device.getName(),
              deviceID: device.getData().id,
              deviceType: device.driver.id,
              dimmable: device.hasCapability('dim')
            }));
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(deviceList));
            }
          }
        });

        ws.on('error', (error) => {
          this.error('WebSocket error:', error);
        });
      });

      this.log(`WebSocket server started on port ${wsPort}`);
    } catch (error) {
      this.error('Failed to start WebSocket server:', error);
    }
  }

  /**
   * Register Flow cards
   */
  registerFlowCards() {
    // Scene Actions (triggers/conditions removed - hub doesn't report scene events)
    this.homey.flow.getActionCard('turn_on_scene')
      .registerRunListener(async (args) => {
        const sceneNumber = args.number;
        const scenePadded = sceneNumber.toString().padStart(2, '0');
        const command = `11${scenePadded}`; // ON command
        this.log(`Flow: Turn ON scene ${sceneNumber} (${command})`);
        await this.sendSceneCommand(command);
      });

    this.homey.flow.getActionCard('turn_off_scene')
      .registerRunListener(async (args) => {
        const sceneNumber = args.number;
        const scenePadded = sceneNumber.toString().padStart(2, '0');
        const command = `13${scenePadded}`; // OFF command
        this.log(`Flow: Turn OFF scene ${sceneNumber} (${command})`);
        await this.sendSceneCommand(command);
      });
  }


  /**
   * Register a device with the app
   * Uses Insteon deviceID as the key for event matching
   * @param {object} device - The device to register
   * @param {object} newSettings - Optional new settings (when called from onSettings)
   */
  registerDevice(device, newSettings = null) {
    this.debugLog(`========================================`);
    this.debugLog(`registerDevice() called`);
    this.debugLog(`  Devices Map ID: ${this.devicesMapId || 'UNDEFINED!'}`);
    this.debugLog(`  Device name: ${device.getName()}`);
    this.debugLog(`  Device driver: ${device.driver.id}`);
    
    // Use provided newSettings or get current settings
    const settings = newSettings || device.getSettings();
    this.debugLog(`  Using ${newSettings ? 'NEW' : 'CURRENT'} settings`);
    this.debugLog(`  Settings: ${JSON.stringify(settings)}`);
    
    const insteonID = settings.deviceID;
    this.debugLog(`  Extracted deviceID: "${insteonID}"`);
    
    if (!insteonID || insteonID === '') {
      this.log(`Cannot register device ${device.getName()} - no Insteon ID set`);
      this.debugLog(`  ❌ Registration aborted - no deviceID`);
      this.debugLog(`========================================`);
      return;
    }
    
    // Register by Insteon deviceID (uppercase) for event matching
    const normalizedID = insteonID.toUpperCase();
    this.debugLog(`  Normalized ID: "${normalizedID}"`);
    this.debugLog(`  Current devices Map size: ${this.devices.size}`);
    this.debugLog(`  Current devices Map keys: [${Array.from(this.devices.keys()).join(', ')}]`);
    
    this.devices.set(normalizedID, device);
    
    this.debugLog(`  ✅ Device added to Map`);
    this.debugLog(`  New devices Map size: ${this.devices.size}`);
    this.debugLog(`  New devices Map keys: [${Array.from(this.devices.keys()).join(', ')}]`);
    this.debugLog(`  Verifying: Can we get it back? ${this.devices.has(normalizedID) ? 'YES' : 'NO'}`);
    this.debugLog(`  Retrieved value: ${this.devices.get(normalizedID) ? 'Device object found' : 'NULL/UNDEFINED'}`);
    
    this.log(`Registered device: ${device.getName()} with Insteon ID ${normalizedID}`);
    this.debugLog(`========================================`);
    
    // Set up event listeners for sensor devices
    if (device.driver.id === 'insteon-contact') {
      this.setupContactSensor(device);
    } else if (device.driver.id === 'insteon-leak') {
      this.setupLeakSensor(device);
    }
  }

  /**
   * Set up contact sensor listeners
   */
  setupContactSensor(device) {
    if (!this.hub) return;

    const deviceId = device.getData().id;
    const door = this.hub.door(deviceId);

    door.on('opened', () => {
      this.log(`Contact sensor ${device.getName()} opened`);
      device.setCapabilityValue('alarm_contact', true).catch(this.error);
      
      this.wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            name: device.getName(),
            id: deviceId,
            deviceType: 'contactsensor',
            state: 'open'
          }));
        }
      });
    });

    door.on('closed', () => {
      this.log(`Contact sensor ${device.getName()} closed`);
      device.setCapabilityValue('alarm_contact', false).catch(this.error);
      
      this.wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            name: device.getName(),
            id: deviceId,
            deviceType: 'contactsensor',
            state: 'closed'
          }));
        }
      });
    });
  }

  /**
   * Set up leak sensor listeners
   */
  setupLeakSensor(device) {
    if (!this.hub) return;

    const deviceId = device.getData().id;
    const leak = this.hub.leak(deviceId);

    leak.on('wet', () => {
      this.log(`Leak sensor ${device.getName()} detected water`);
      device.setCapabilityValue('alarm_water', true).catch(this.error);
      
      this.wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            name: device.getName(),
            id: deviceId,
            deviceType: 'leaksensor',
            state: 'wet'
          }));
        }
      });
    });

    leak.on('dry', () => {
      this.log(`Leak sensor ${device.getName()} is dry`);
      device.setCapabilityValue('alarm_water', false).catch(this.error);
      
      this.wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            name: device.getName(),
            id: deviceId,
            deviceType: 'leaksensor',
            state: 'dry'
          }));
        }
      });
    });
  }

  /**
   * Unregister a device from the app
   */
  unregisterDevice(device) {
    const settings = device.getSettings();
    const insteonID = settings.deviceID;
    
    if (insteonID && insteonID !== '') {
      const normalizedID = insteonID.toUpperCase();
      this.devices.delete(normalizedID);
      this.log(`Unregistered device: ${device.getName()} (${normalizedID})`);
    }
  }

  /**
   * Get the Insteon hub instance
   */
  getHub() {
    return this.hub;
  }

  /**
   * Check if connected to hub
   */
  isConnectedToHub() {
    return this.connectedToHub;
  }

  /**
   * Send scene command to hub
   * @param {string} command - 4-character command (e.g., '1121' for ON scene 21)
   */
  async sendSceneCommand(command) {
    this.debugLog(`========================================`);
    this.debugLog(`sendSceneCommand() called`);
    this.debugLog(`  Command: ${command}`);
    
    // Get hub settings
    const hubHost = this.homey.settings.get('hubHost');
    const hubPort = this.homey.settings.get('hubPort') || 25105;
    const hubUser = this.homey.settings.get('hubUser') || '';
    const hubPass = this.homey.settings.get('hubPass') || '';
    const hubModel = this.homey.settings.get('hubModel') || '2245';

    if (!hubHost) {
      throw new Error('Hub not configured');
    }
    
    // Check credentials requirement based on hub model
    if (hubModel === '2245' && (!hubUser || !hubPass)) {
      throw new Error('Hub 2245 requires username and password');
    }

    // Build URL - scene format: http://[user:pass@]host:port/0?1121=I=0-
    // For 2242 without credentials, omit the user:pass@ part
    let url, safeUrl;
    if (hubUser && hubPass) {
      url = `http://${hubUser}:${hubPass}@${hubHost}:${hubPort}/0?${command}=I=0-`;
      safeUrl = `http://***:***@${hubHost}:${hubPort}/0?${command}=I=0-`;
    } else {
      url = `http://${hubHost}:${hubPort}/0?${command}=I=0-`;
      safeUrl = `http://${hubHost}:${hubPort}/0?${command}=I=0-`;
    }
    this.debugLog(`  URL: ${safeUrl}`);

    try {
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

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            this.debugLog(`  Scene command sent successfully`);
            this.debugLog(`========================================`);
            resolve(data);
          });
        });

        req.on('error', (error) => {
          this.error('Scene command failed:', error);
          this.debugLog(`========================================`);
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          this.error('Scene command timeout');
          this.debugLog(`========================================`);
          reject(new Error('Request timeout'));
        });

        req.end();
      });
    } catch (error) {
      this.error('Failed to send scene command:', error);
      this.debugLog(`========================================`);
      throw error;
    }
  }

  /**
   * onUninit is called when the app is destroyed
   */
  async onUninit() {
    this.log('Insteon app is shutting down...');
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
}

module.exports = InsteonApp;
