# Insteon for Homey

Control your Insteon devices directly through Homey Pro via Insteon Hub (models 2245/2242).

[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/logname/com.insteon)
[![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](LICENSE)
[![Homey](https://img.shields.io/badge/Homey-12.2.0+-purple.svg)](https://homey.app)


## Features

✅ **Fast Direct Control** - Direct HTTP commands to hub (~100ms response)  
✅ **Real-time Events** - Bidirectional sync via home-controller library  
✅ **Scene Support** - Trigger hub-stored scenes from Flows  
✅ **Multiple Device Types** - Lights, switches, sensors, and scenes  
✅ **Multi-language** - English, Dutch, German, Spanish, French  

## Requirements

- **Homey Pro** with firmware **12.2.0 or higher**
- **Insteon Hub** (model 2245 or 2242) on your local network
- Hub **username** and **password** (optional for model 2242)
- Insteon device IDs (6-character hex, e.g., `45ED1C`)

## Supported Devices

### Lights & Switches
- **Insteon Dimmer/Light** - Dimmable lights with smooth brightness control
  - On/Off control
  - Dimming (0-100%)
  - Fast ON/OFF commands (optional)
  
- **Insteon Switch** - On/Off switches for outlets and appliances
  - On/Off control
  - No dimming capability

### Sensors
- **Insteon Contact Sensor** - Door/window sensors
  - Reports open/closed state
  - Real-time updates

- **Insteon Leak Sensor** - Water leak detection
  - Detects wet/dry conditions
  - Instant alerts

- **Insteon Motion Sensor** - Motion detection
  - Reports active/inactive state
  - Real-time motion events

### Scenes
- **Insteon Scene** - Trigger groups of devices
  - Activate/deactivate hub-stored scenes
  - Control multiple devices simultaneously
  - Optional fast ON/OFF

## Installation

### 1. Install the App

```bash
# Via Homey CLI (for development/testing)
homey app install

# Or install from Homey App Store (when published)
```

### 2. Configure Hub Settings

1. Open **Homey Settings** → **Apps** → **Insteon for Homey**
2. Enter your hub details:
   - **Hub IP Address**: Local IP of your Insteon Hub
   - **Hub Port**: 25105 (default)
   - **Username**: Your hub username
   - **Password**: Your hub password
3. Click **Save**

### 3. Add Devices

1. Go to **Devices** → **Add Device** → **Insteon for Homey**
2. Select device type
3. Add placeholder device
4. Configure Device ID in device settings:
   - Open device settings
   - Enter 6-character **Insteon Device ID** (e.g., `45ED1C`)
   - Save settings
5. Device will sync automatically

## Finding Device IDs

Your Insteon Device ID is the 6-character hexadecimal address printed on each device:
- Usually found on a label on the device
- Format: `XX.XX.XX` or `XXXXXX`
- Example: `45.ED.1C` or `45ED1C`

## Flow Cards

### Actions
- **Turn on scene [[number]]** - Activate a scene (1-255)
- **Turn off scene [[number]]** - Deactivate a scene (1-255)

### Usage Example

```
WHEN: Motion detected in hallway
THEN: Turn on scene 15 (Night Lighting)
```

## Configuration

### Device Settings

**All Devices:**
- Device ID (required)

**Dimmer/Light:**
- Fast ON/OFF commands (optional)

**Scene:**
- Scene number (1-255)
- Fast ON/OFF (optional)

### Debug Logging

Enable debug logging in app settings to troubleshoot issues:
1. Open app settings
2. Enable "Debug Logging"
3. View logs in real-time
4. Disable when done (logs are memory-only)

## Troubleshooting

### Using Test Connection

**Before saving settings**, always use the "Test Connection" button to verify your configuration:

1. Enter hub details (IP, port, credentials)
2. Click the green **"Test Connection"** button
3. Wait for result (5-10 seconds)
4. ✅ Success: "Connection successful! Hub is reachable." → Safe to save
5. ❌ Error: Fix the issue indicated in the error message, then test again

**Common Error Messages:**
- "Hub unreachable" → Check IP address and network
- "Connection timeout" → Hub may be offline or wrong IP
- "Connection refused" → Check port number (default: 25105)
- "Hub not found" → Verify IP address is correct

### Device Not Responding

1. **Test connection first** using the Test Connection button
2. Verify hub is online
3. Check device ID is correct
4. Ensure device is paired with hub
5. Test device using hub's web interface

### Events Not Syncing

1. **Test connection first** to verify hub connectivity
2. Check hub connection in app settings
3. Verify device is registered (check device settings)
4. Enable debug logging to see events
5. Restart app if needed

### Scene Not Working

1. **Test connection first** to verify hub access
2. Verify scene number is correct (1-255)
3. Test scene from hub's web interface
4. Check hub credentials in app settings

### App Keeps Crashing

If the app crashes repeatedly (400+ crashes):
1. **DO NOT save settings without testing first**
2. Use Test Connection to verify hub is reachable
3. Fix any errors shown before saving
4. Only save settings after successful test

For more help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Development

### Testing Commands

```bash
# Validate app structure and manifest
homey app validate

# Run app in development mode (live reload)
homey app run

# Install app on Homey
homey app install

# Build app for publishing
homey app build

# Update version
homey app version patch|minor|major
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full development guide.

## Technical Details

- **Architecture**: Direct HTTP to hub + WebSocket event listener
- **Hub Protocol**: HTTP GET commands for control
- **Event Listener**: home-controller library via TCP/HTTP
- **SDK**: Homey Apps SDK v3
- **Node.js**: >= 16.0.0

See [TECHNICAL.md](TECHNICAL.md) for implementation details.

## Complete Changelog

### v1.7.0 (2025-03-17) - Test Connection WORKING! ✅
- **THE FIX**: Added missing `api` section to app.json
- Test Connection now fully functional
- Debug log auto-shows during test for troubleshooting
- Proper success/error messages display
- Fixed version display (now shows 1.7.0)

### v1.6.9 (2025-03-17) - Debug logging in UI

### v1.6.8 (2025-03-17) - Console logging added

### v1.6.7 (2025-03-17) - Test Connection Fixed (api.js created)
- Test Connection now works using proper Homey API pattern
- Created api.js file for API endpoints
- Instant feedback with proper error messages
- Based on working Hubitat-Homey integration pattern

### v1.6.6 (2025-03-17) - Settings-based approach (non-working)

### v1.6.5 (2025-03-16) - Test Connection
- Added "Test Connection" button to prevent crash loops
- User-friendly error messages for network issues
- Validates hub connectivity before saving settings

### v1.6.0 (2025-02-16) - Hub 2242 Support
- Hub 2242 no longer requires username/password (for older unsecured hubs)
- Hub model selector in settings
- Dynamic validation based on hub model

### v1.5.3 (2025-02-16) - Image Fix
- Fixed app store images (large.png now 500x350)

### v1.5.2 (2025-02-16) - Beta Preparation
- Documentation and attribution updates
- Full transparency about development roles
- Prepared for App Store beta testing

### v1.5.1 (2025-02-15) - Scene Actions Only
- Removed scene triggers/conditions (not supported by hub)
- Kept working scene actions

### v1.5.0 (2025-02-15) - Scene Flow Cards
- Added scene Flow action cards
- Turn on/off scenes directly from Flows

### v1.4.0 (2025-02-14) - Scene Devices
- New Insteon Scene device type
- Activate/deactivate hub-stored scenes
- Optional fast ON/OFF per scene

### v1.3.1 (2025-02-14) - Settings Cleanup
- Removed dimmable setting (dimmers are always dimmable)
- Removed fast commands from switches (only for dimmers)
- Cleaner settings interface

### v1.3.0 (2025-02-14) - Motion Sensor Simplified
- Motion sensor follows contact sensor pattern
- Removed artificial timeout
- Real-time state reporting

### v1.2.6 (2025-02-14) - Contact Sensor Heartbeats
- Added heartbeat handling for contact sensors

### v1.2.5 (2025-02-14) - Leak Sensor Fixed
- Critical fix: cmd2 determines wet/dry state (not cmd1)
- Correct leak detection

### v1.2.4 (2025-02-14) - Leak Sensor Heartbeats
- Recognized 0x06 as heartbeat (not dry signal)

### v1.2.3 (2025-02-14) - Leak Sensor Attempt
- Attempted fix for leak sensor dry detection

### v1.2.2 (2025-02-14) - Debug UI Improvements
- Debug log container persistence
- Better sensor event logging

### v1.2.1 (2025-02-14) - Sensor Registration Fixed
- Fixed sensor device registration
- Contact, leak, and motion sensors working

### v1.2.0 (2025-02-13) - Full Sensor Support
- Added contact, leak, and motion sensors
- Manual dimming commands (hold to dim)

### v1.1.7 (2025-02-13) - Device Registration Working
- Fixed settings callback issue
- Device registration with Map tracking

### v1.1.0-v1.1.6 (2025-02-13) - Registration Debugging
- Extensive Map lifecycle tracking
- Device registration fixes
- Settings-based debug polling

### v1.0.9 (2025-02-13) - Debug Logging
- Added comprehensive debug logging
- Settings-based polling approach

### v1.0.8 (2025-02-13) - HTTP URL Format
- Fixed URL format (added trailing dash)

### v1.0.7 (2025-02-13) - Event Matching
- Fixed event matching by Device ID

### v1.0.6 (2025-02-13) - HTTP Commands
- Switched to direct HTTP for performance
- Fast response (~100ms)

### v1.0.0-v1.0.5 (2025-02-13) - Initial Development
- SDK 3 compatibility
- Basic dimmer and switch support
- Settings structure
- Real-time event listening

For detailed changes, see [CHANGELOG.md](CHANGELOG.md)

## Credits & Attribution

### Original Code
- **Chris Wilson (@cwwilson08)**: Original Hubitat Groovy drivers (Insteon-Hubitat repository)
  - Groovy device drivers for Hubitat
  - HTTP command format and protocol
  - Event handling patterns

### Homey App Development
- **Claude (Anthropic AI Assistant)**: Complete app development (v1.0.0-v1.5.2)
  - Groovy to Homey SDK 3 conversion
  - Architecture design and implementation
  - All device drivers (dimmer, switch, contact, leak, motion, scene)
  - Event listener integration
  - Flow cards and UI
  - Multi-language support
  - All features and bug fixes

### Third-party Libraries
- **home-controller** (v0.9.2): Insteon hub communication library
- **ws** (v8.16.0): WebSocket server for compatibility

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/logname/com.insteon/issues)
- **Discussions**: [Homey Community Forum](https://community.homey.app)
- **Documentation**: See docs in this repository

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

