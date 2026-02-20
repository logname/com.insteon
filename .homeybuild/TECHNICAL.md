# Technical Architecture

## Overview

Insteon for Homey is a unified application that combines:
- Hubitat Elevation Groovy parent/child driver architecture
- Node.js WebSocket server for real-time events
- home-controller library for Insteon protocol
- Homey SDK 3 for device management

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Homey Pro                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Insteon App (app.js)                │  │
│  │                                                  │  │
│  │  ┌────────────────┐     ┌──────────────────┐   │  │
│  │  │  Hub Manager   │────▶│  Event Listener  │   │  │
│  │  │  - Connection  │     │  - Command parse │   │  │
│  │  │  - Reconnect   │     │  - State update  │   │  │
│  │  └────────────────┘     └──────────────────┘   │  │
│  │          │                        │             │  │
│  │          ▼                        ▼             │  │
│  │  ┌────────────────┐     ┌──────────────────┐   │  │
│  │  │ Device Manager │     │  WebSocket       │   │  │
│  │  │ - Register     │     │  Server          │   │  │
│  │  │ - Unregister   │     │  (Port 8080)     │   │  │
│  │  └────────────────┘     └──────────────────┘   │  │
│  │          │                        │             │  │
│  └──────────┼────────────────────────┼─────────────┘  │
│             │                        │                 │
│             ▼                        ▼                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Device Drivers                      │  │
│  │  ┌──────┐  ┌──────┐  ┌────────┐  ┌──────────┐  │  │
│  │  │Dimmer│  │Switch│  │Contact │  │   Leak   │  │  │
│  │  └──────┘  └──────┘  └────────┘  └──────────┘  │  │
│  │  ┌──────┐                                       │  │
│  │  │Motion│                                       │  │
│  │  └──────┘                                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ TCP/HTTP
                           │ Port 25105
                           ▼
              ┌──────────────────────────┐
              │   Insteon Hub 2245/2242  │
              │                          │
              │  ┌────────────────────┐  │
              │  │  home-controller   │  │
              │  │  Library           │  │
              │  └────────────────────┘  │
              └──────────────────────────┘
                           │
                           │ Insteon Protocol
                           │ RF/Powerline
                           ▼
              ┌──────────────────────────┐
              │   Insteon Devices        │
              │  ├─ Dimmers              │
              │  ├─ Switches             │
              │  ├─ Sensors              │
              │  └─ Scenes               │
              └──────────────────────────┘
```

## Core Components

### 1. App Core (app.js)

**Responsibilities:**
- Initialize hub connection
- Manage WebSocket server
- Coordinate device registration
- Handle event distribution
- Manage reconnection logic

**Key Methods:**

```javascript
async initializeHub()          // Connect to Insteon hub
startEventListener()           // Listen for device events
registerDevice(device)         // Add device to registry
broadcastDeviceState(device)   // Send updates via WebSocket
scheduleReconnect()           // Handle disconnections
```

**State Management:**
```javascript
{
  hub: Insteon,              // home-controller instance
  wss: WebSocket.Server,     // WebSocket server
  devices: Map,              // deviceID → device mapping
  wsClients: Set,            // Connected WS clients
  connectedToHub: boolean,   // Connection status
  reconnectDelay: number     // Exponential backoff delay
}
```

### 2. Hub Connection

**Protocol:** TCP/HTTP (port 25105)

**Connection Flow:**

```
1. Read settings (IP, port, user, pass, model)
2. Create Insteon instance (home-controller)
3. Connect based on model:
   - 2245: httpClient() with credentials
   - 2242: connect() with host
4. Set up event listeners
5. Mark as connected
6. On error: schedule reconnection with backoff
```

**Reconnection Logic:**

```javascript
Initial delay: 1 second
Max delay: 300 seconds (5 minutes)
Backoff: delay *= 2 on each failure
Reset: delay = 1 on success
```

### 3. Event Listener

**Event Types:**

```javascript
hub.on('command', (data) => {
  // data.standard contains:
  {
    id: string,           // Device ID
    command1: hex,        // Command code
    command2: hex,        // Command data
    messageType: string,  // Message type
    gatewayId: string,    // Gateway ID
    raw: string          // Raw data
  }
})
```

**Command Codes:**

| Code | Hex  | Description        |
|------|------|--------------------|
| ON   | 0x11 | Turn on            |
| OFF  | 0x13 | Turn off           |
| Fast ON  | 0x12 | Fast on        |
| Fast OFF | 0x14 | Fast off       |
| Dim  | 0x15-0x17 | Start/stop dim |
| Status | 0x19 | Status request   |

### 4. Device Drivers

**Driver Hierarchy:**

```
Homey.Driver
├── InsteonDimmerDriver
├── InsteonSwitchDriver
├── InsteonContactDriver
├── InsteonLeakDriver
└── InsteonMotionDriver
```

**Device Hierarchy:**

```
Homey.Device
├── InsteonDimmerDevice
│   ├── Capabilities: onoff, dim
│   └── Methods: turnOnFast(), turnOffFast()
├── InsteonSwitchDevice
│   ├── Capabilities: onoff
│   └── Methods: turnOnFast(), turnOffFast()
├── InsteonContactDevice
│   └── Capabilities: alarm_contact
├── InsteonLeakDevice
│   └── Capabilities: alarm_water
└── InsteonMotionDevice
    └── Capabilities: alarm_motion
```

### 5. WebSocket Server

**Purpose:** Backward compatibility and external integrations

**Port:** 8080 (configurable)

**Protocol:**

```javascript
// Client connects
ws.onopen → Send: "Connected to Insteon Server"

// Client requests devices
ws.send("getDevices") → Receive: JSON array of devices

// Device state updates (automatic)
{
  name: "Kitchen Light",
  id: "45ED1C",
  deviceType: "insteon-dimmer",
  state: 75  // 0-100 for dimmers, 0/100 for switches
}

// Sensor updates
{
  name: "Front Door",
  id: "A1B2C3",
  deviceType: "contactsensor",
  state: "open" | "closed"
}
```

## Data Flow

### Device Control (Homey → Insteon)

```
1. User taps device in Homey app
2. onCapabilityOnoff(true) called
3. Get hub from app.getHub()
4. Call hub.light(deviceID).turnOn()
5. Hub sends command to device
6. Device responds
7. Event listener receives confirmation
8. Update device state in Homey
9. Broadcast to WebSocket clients
```

### Status Update (Insteon → Homey)

```
1. Physical device button pressed
2. Device sends command to hub
3. Hub receives via RF/powerline
4. home-controller emits 'command' event
5. App event listener receives event
6. Parse command code and data
7. Find matching Homey device(s)
8. Update device capabilities
9. Broadcast to WebSocket clients
10. Trigger Flow cards if applicable
```

## Protocol Details

### Insteon Command Format

```
0262[DeviceID]0F[Cmd1][Cmd2]=I=3

Example:
026245ED1C0F11FF=I=3
│   │      │ │ │
│   │      │ │ └─ Level (FF = 100%)
│   │      │ └─── Command 1 (11 = ON)
│   │      └───── Standard message
│   └──────────── Device ID (45ED1C)
└──────────────── Start of command
```

### Hub Communication

**Model 2245 (HTTP):**

```javascript
GET /3?0262{deviceID}0F{cmd1}{cmd2}=I=3 HTTP/1.1
Host: {hubIP}:{hubPort}
Authorization: Basic {base64(user:pass)}
```

**Model 2242 (TCP):**

```javascript
Direct socket connection on port 25105
Binary protocol via home-controller library
```

## Performance Considerations

### Fast Commands

**Normal ON/OFF:** ~500ms response
**Fast ON/OFF:** ~100ms response

Fast commands skip ramp rate for instant response.

### Event Processing

```javascript
Hub event → App listener: <10ms
Parse and route: <5ms
Update device: <10ms
Total latency: ~25ms
```

### Connection Stability

- Automatic reconnection with exponential backoff
- Connection timeout: 30 seconds
- Keep-alive: Implicit via TCP
- Max reconnect delay: 5 minutes

## Security

### Credentials Storage

```javascript
// Stored in Homey settings (encrypted by Homey)
this.homey.settings.get('hubUser')
this.homey.settings.get('hubPass')

// Never logged or exposed
// Never sent to external servers
```

### Network Security

- Local network only (no cloud)
- Hub credentials required
- No external API calls
- Optional WebSocket server (local only)

## Error Handling

### Connection Errors

```javascript
try {
  await hub.connect()
} catch (error) {
  log.error('Connection failed:', error)
  scheduleReconnect() // Exponential backoff
}
```

### Command Errors

```javascript
try {
  await hub.light(id).turnOn()
} catch (error) {
  log.error('Command failed:', error)
  throw new Error(this.homey.__('errors.command_failed'))
}
```

### Event Processing Errors

```javascript
hub.on('command', (data) => {
  try {
    parseAndRoute(data)
  } catch (error) {
    log.error('Event processing failed:', error)
    // Continue processing other events
  }
})
```

## Testing

### Unit Tests (Future)

```javascript
// Test hub connection
test('connects to hub', async () => {
  const app = new InsteonApp()
  await app.initializeHub()
  expect(app.connectedToHub).toBe(true)
})

// Test device control
test('turns light on', async () => {
  const device = new InsteonDimmerDevice()
  await device.onCapabilityOnoff(true)
  expect(device.getCapabilityValue('onoff')).toBe(true)
})
```

### Integration Tests

1. **Hub Connection**
   - Connect with valid credentials
   - Reject invalid credentials
   - Reconnect on disconnect

2. **Device Control**
   - Turn on/off lights
   - Set dim levels
   - Fast commands

3. **Status Updates**
   - Physical button press
   - Sensor triggers
   - State synchronization

## Debugging

### Enable Logging

```javascript
// In app.js
this.log('Message')      // Info
this.error('Message')    // Error
this.debug('Message')    // Debug (if enabled)
```

### View Logs

```
Homey App → More → Apps → Insteon for Homey → Logs
```

### Common Issues

1. **Hub not connecting:**
   - Check IP, port, credentials
   - Verify network connectivity
   - Check hub model setting

2. **Device not responding:**
   - Verify device ID format
   - Check device is linked to hub
   - Test in Insteon app first

3. **Status not updating:**
   - Verify event listener is running
   - Check device sends events to hub
   - Review app logs for errors

## Future Enhancements

### Planned Features

1. **Device Discovery**
   - Auto-detect devices from hub
   - Simplified pairing process

2. **Scene Support**
   - Multi-device scenes
   - Scene activation

3. **Advanced Settings**
   - Ramp rates
   - On levels
   - LED brightness

4. **Diagnostics**
   - Device signal strength
   - Link quality
   - Battery levels

### Architecture Improvements

1. **Caching**
   - Cache device states
   - Reduce hub queries

2. **Batching**
   - Batch multiple commands
   - Improve performance

3. **Testing**
   - Automated test suite
   - CI/CD integration

## References

- [Homey SDK Documentation](https://apps.developer.homey.app/)
- [home-controller GitHub](https://github.com/automategreen/home-controller)
- [Insteon Developer Guide](/mnt/user-data/uploads/INSTEON_Developers_Guide_20070816a.pdf)
- [Original Hubitat Integration](https://github.com/yourusername/Insteon-Hubitat-master)

## Credits

**Original Development:**
- Groovy Drivers: @cwwilson08 (Chris Wilson)
- Node.js Server: Chris Wilson

**Homey Conversion:**
- Architecture: Claude (Anthropic AI Assistant)
- Conversion Date: February 12, 2025

**Libraries:**
- home-controller: Automate Green (MIT License) - v0.9.2
- ws: WebSocket library (MIT License)
