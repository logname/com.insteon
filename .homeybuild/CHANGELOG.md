# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-02-16

### Added
- **Hub 2242 Support Without Credentials**: Username/password now optional for older 2242 hubs
  - Hub model selector in settings (2245 / 2242)
  - 2245: Credentials required (as before)
  - 2242: Credentials optional (for unsecured older hubs)
  - Updated settings UI to show requirement status
  - HTTP commands work with or without authentication based on hub model

### Changed
- Settings page dynamically updates based on hub model selection
- Validation only requires credentials for Hub 2245
- All HTTP command methods support optional authentication

### Technical Details
- When 2242 selected and credentials blank, URLs built without `user:pass@` prefix
- Authorization header only added when credentials provided
- All device drivers (dimmer, switch, scene) updated to support optional auth

## [1.5.3] - 2025-02-16

### Fixed
- **App Store Images**: Resized large.png to required 500x350 dimensions
  - small.png: 250x175 ✅
  - large.png: 500x350 ✅ (was 250x175)
  - xlarge.png: 1000x700 ✅

## [1.5.2] - 2025-02-16

### Changed
- **Beta Testing Preparation**: Documentation and attribution updates
- Updated contributors section with full transparency about development roles
- Prepared for Homey App Store beta testing

### Documentation
- Enhanced README.md with complete device type listings
- Updated CONTRIBUTING.md with proper Homey CLI testing commands
- Verified firmware compatibility requirement (12.2.0 or higher)

### Attribution
- Added Chris Wilson (@cwwilson08) attribution for original Hubitat Groovy drivers
- Full disclosure of Claude's role in complete app development (v1.0.0-v1.5.2)

## [1.5.1] - 2025-02-15

### Removed
- **Scene Triggers**: Removed (hub doesn't report scene events)
  - ~~Scene [[number]] was triggered~~
  - ~~Scene [[number]] turned on~~
  - ~~Scene [[number]] turned off~~
- **Scene Conditions**: Removed (hub doesn't report scene state)
  - ~~Scene [[number]] is triggered~~
  - ~~Scene [[number]] is on~~
  - ~~Scene [[number]] is off~~

### Kept
- **Scene Actions**: Working correctly ✅
  - Turn on scene [[number]]
  - Turn off scene [[number]]

### Technical Note
The Insteon hub/home-controller library does not report scene events, so we cannot trigger flows based on scene activation or check scene state. Scene actions work because we send commands directly to the hub.

## [1.5.0] - 2025-02-15

### Added
- **Scene Flow Cards**: Control scenes directly from Flows without creating devices

**Flow Triggers:**
- "Scene [[number]] was triggered" - When any scene action occurs
- "Scene [[number]] turned on" - When scene is turned on
- "Scene [[number]] turned off" - When scene is turned off

**Flow Conditions:**
- "Scene [[number]] !{{is|isn't}} triggered" - Check if scene has been used
- "Scene [[number]] !{{is|isn't}} on" - Check if scene is on
- "Scene [[number]] !{{is|isn't}} off" - Check if scene is off

**Flow Actions:**
- "Turn on scene [[number]]" - Activate a scene (1-255)
- "Turn off scene [[number]]" - Deactivate a scene (1-255)

### Usage Examples
**Simple Flow:**
- When: Motion detected
- Then: Turn on scene 15 (Movie Mode)

**Advanced Flow:**
- When: Scene 20 turned on
- And: Scene 20 is on
- Then: Send notification "Away mode activated"

## [1.4.0] - 2025-02-14

### Added
- **Insteon Scene support**: New device type for triggering hub-stored scenes
  - Scene number setting (1-255)
  - Fast ON/OFF option per scene
  - Simple ON/OFF control triggers entire scene

### Technical Details
**Scene Commands:**
- ON: `11{scene}` (e.g., `1121` = scene 21 ON)
- OFF: `13{scene}` (e.g., `1321` = scene 21 OFF)
- Fast ON: `12{scene}` (e.g., `1221` = scene 21 fast ON)
- Fast OFF: `14{scene}` (e.g., `1421` = scene 21 fast OFF)

**Scene URL Format:**
`http://user:pass@hub:port/0?{command}=I=0-`

### Usage
1. Add "Insteon Scene" device
2. Configure scene number in settings (1-255)
3. Optionally enable "Use Fast ON/OFF"
4. Toggle scene ON/OFF from Homey

## [1.3.1] - 2025-02-14

### Fixed
- **Switch fastCommands**: Removed from switches (they don't support it)
- **Dimmer fastCommands**: Kept for dimmers/lights (they do support it)

### Settings Per Device Type
- **Dimmer/Light**: deviceID, fastCommands ✓
- **Switch**: deviceID only
- **Contact Sensor**: deviceID only
- **Leak Sensor**: deviceID only  
- **Motion Sensor**: deviceID only

## [1.3.0] - 2025-02-14

### Changed
- **Motion sensor**: Simplified to match contact sensor behavior
  - cmd1: 0x11 = ACTIVE (motion detected)
  - cmd1: 0x13 = INACTIVE (no motion)  
  - cmd1: 0x06 = Heartbeat (ignored)
  - Removed 30-second auto-reset timeout
- **Removed dimmable setting**: All dimmers are dimmable by definition
- **Sensor settings cleanup**: Contact, leak, and motion sensors now only have deviceID setting
- **Fast commands**: Now only available for dimmers and switches (removed from sensors)

### Technical Details
- Motion sensors now respond immediately to sensor state changes
- No more artificial timeouts - sensors report actual state
- Cleaner settings interface - removed unnecessary options

## [1.2.6] - 2025-02-14

### Added
- Contact sensor heartbeat (0x06) handling - now ignored properly

### Technical Details
Contact sensors were already correct:
- **cmd1: 0x11** = OPEN → `alarm_contact = true`
- **cmd1: 0x13** = CLOSED → `alarm_contact = false`
- **cmd1: 0x06** = Heartbeat → Ignored

## [1.2.5] - 2025-02-14

### Fixed
- **Leak sensor CORRECTED**: It's cmd2 that determines wet vs dry, not cmd1!
- **cmd1: 0x11, cmd2: 0x02** = WET → Sets alarm
- **cmd1: 0x11, cmd2: 0x01** = DRY → Clears alarm  
- **cmd1: 0x06** = Heartbeat → Ignored

### Technical Details
Previous versions incorrectly triggered WET on any 0x11 command.
Now properly checks cmd2: 0x02=wet, 0x01=dry.

## [1.2.4] - 2025-02-14

### Fixed
- **Leak sensor alarm persistence**: 0x06 is a heartbeat, NOT a dry signal
- Alarm now only clears when button is pressed (0x13)
- Water alarm will stay active until manually reset

### Technical Details
- **0x11** = WET (water detected) → Sets alarm
- **0x06** = Heartbeat (ignored) → Alarm stays in current state
- **0x13** = Manual reset button → Clears alarm

## [1.2.3] - 2025-02-14

### Fixed
- **Leak sensor DRY detection**: Now handles command 0x06 (heartbeat/dry signal)
- Leak sensor will now properly clear water alarm when dry

### Technical Details
- Leak sensors send 0x11 for WET and 0x06 for DRY (heartbeat)
- Handler now accepts both 0x06 and 0x13 as DRY signals

## [1.2.2] - 2025-02-14

### Fixed
- Debug log container now shows when reopening settings if debug logging is enabled
- Debug logging now shows correct handler name (handleLeakEvent, handleContactEvent, etc.)
- Version banner updated to 1.2.2

### Changed
- Improved debug logging to identify which sensor handler is being called

## [1.2.1] - 2025-02-14

### Fixed
- **CRITICAL**: Sensors now register properly when Device ID is configured
- Contact, leak, and motion sensors now pass newSettings to registerDevice
- All sensors will now show up in registered device list and receive events

### Changed
- Debug log UI now hides completely when debug logging is disabled
- Debug log container shows/hides based on checkbox state
- Version updated to 1.2.1 in debug banner

## [1.2.0] - 2025-02-14

### Added
- **Full sensor support** for contact, leak, and motion sensors
- Contact sensor: Open (0x11) = alarm_contact true, Closed (0x13) = alarm_contact false
- Leak sensor: Wet (0x11) = alarm_water true, Dry (0x13) = alarm_water false
- Motion sensor: Active (0x11) = alarm_motion true, auto-resets to inactive after 30 seconds
- Motion sensor: Also handles explicit inactive (0x13) command
- Debug logging for all sensor events

### Changed
- Sensor event handlers now fully implemented (were placeholders)
- Motion sensor properly clears timeout when new motion detected
- All sensor states now sync properly with Homey

## [1.1.7] - 2025-02-14

### Added
- Support for manual dimming commands (0x16, 0x17, 0x18)
- Command 0x17: Start manual brighten (press and hold up)
- Command 0x16: Start manual dim (press and hold down)
- Command 0x18: Stop manual dimming (release button, queries current level)

### Changed
- No more "Unhandled command: 0x17" warnings
- Manual dimming now properly updates Homey when button released

## [1.1.6] - 2025-02-14

### Fixed
- **CRITICAL BUG FOUND AND FIXED**: registerDevice was reading OLD settings instead of NEW settings
- onSettings now passes newSettings directly to registerDevice
- Device will now actually register when Device ID is configured

### Technical Details
- Problem: `device.getSettings()` returned old values during `onSettings` callback
- Solution: Pass `newSettings` parameter directly to `registerDevice(device, newSettings)`
- registerDevice now accepts optional newSettings parameter

## [1.1.5] - 2025-02-13

### Added
- Map lifecycle tracking with unique ID
- Logs show if we're dealing with the same Map object
- Verification that devices can be retrieved immediately after being added
- Map ID shown in all registration and event logs

### Changed
- Version updated to 1.1.5
- More detailed Map state logging at every step

## [1.1.4] - 2025-02-13

### Fixed
- Added extensive debugging to registerDevice() function
- Debug logs now show Map operations in detail
- Version banner updated to 1.1.4

### Changed
- registerDevice() logs every step: settings extraction, ID normalization, Map operations
- Shows Map size before and after registration
- Shows all registered device IDs for comparison

## [1.1.3] - 2025-02-13

### Fixed
- **CRITICAL**: Device registration now actually happens when Device ID is configured
- Switch onSettings was missing registration logic entirely - FIXED
- Added debug logging to onSettings handlers to track registration
- Debug logs now show when device ID changes and registration occurs

### Changed
- Version banner updated to 1.1.3
- More verbose debug logging in device settings changes

## [1.1.2] - 2025-02-13

### Fixed
- **CRITICAL**: Fixed debug logging to actually work in real-time
- Changed from `homey.api.realtime()` (doesn't exist) to settings-based polling
- Debug logs now update every 500ms when settings page is open
- Version number in banner updated to 1.1.2

### Changed
- **Fast ON/OFF now defaults to OFF** (was ON)
- Debug logging uses settings storage and polling instead of events
- Logs are preserved when closing and reopening settings

## [1.1.1] - 2025-02-13

### Added
- **Debug Logging UI** in app settings page
- Enable/disable debug logging checkbox
- Real-time event log display in settings (selectable text)
- Clear Logs button
- Version banner when debug logging enabled
- Detailed event listener logging visible in settings page

### Changed
- Event logs now show in settings UI instead of just container logs
- Debug logs include timestamps
- All event processing logged when debug mode enabled

## [1.1.0] - 2025-02-13

### Fixed
- **CRITICAL**: Added missing trailing `-` to HTTP command URL format
- Added comprehensive logging to event listener to debug status update issues
- Added capability check before setting 'dim' (switches don't have dim capability)
- Fixed level query to use device's Insteon ID instead of Homey internal ID

### Changed
- HTTP URL now: `/3?0262{deviceID}0F{cmd}{level}=I=3-` (with trailing dash)
- Event listener logs every received event with full details
- handleLightEvent logs which command path it takes and capability updates

## [1.0.9] - 2025-02-13

### Fixed
- **CRITICAL**: Rewrote HTTP request handling using native Node.js http module
- Added comprehensive error logging to diagnose command failures
- Fixed URL parsing and authentication header handling
- Logs now show every step: settings load → URL build → HTTP request → response

### Changed
- Switched from `http.min` to native Node.js `http` module
- Added detailed logging at every step for troubleshooting
- Better error messages with full stack traces

## [1.0.8] - 2025-02-13

### Fixed
- **CRITICAL**: Fixed "Failed to execute command" error
- Corrected settings access (use `this.homey.settings.get()` not `app.homey.settings.get()`)
- Changed HTTP library from `fetch` to `http.min` (Homey standard)
- Added better error logging to help diagnose connection issues

## [1.0.7] - 2025-02-13

### Fixed
- **CRITICAL**: Replaced home-controller device control with direct HTTP commands
- Fixed timeout errors when toggling/dimming quickly
- Fixed sync issues between physical device and Homey controls
- Fixed event listener to properly match devices by Insteon deviceID
- Device status updates now work when physically controlling Insteon devices

### Changed
- Control commands now use direct HTTP to hub (`/3?0262{deviceID}0F{cmd}{level}=I=3`)
- Devices registered by Insteon deviceID instead of Homey internal ID
- home-controller now only used for listening to device events, not control
- Much faster response time (no more 10 second timeouts)
- Smooth dimming with almost no lag

### Technical
- Added `sendDirectCommand()` method to dimmer and switch devices
- Updated `registerDevice()` to use Insteon deviceID as map key
- Event listener matches devices by uppercase Insteon deviceID
- Commands: 11=ON, 12=FastON, 13=OFF, 14=FastOFF + level in hex

## [1.0.6] - 2025-02-13

### Fixed
- **CRITICAL**: Capability listeners now register even when device not configured
- Fixed "Missing Capability Listener: onoff" error
- Fixed "Missing Capability Listener: dim" error
- Capability handlers now check if device is configured before executing commands
- Devices show proper error message when trying to control unconfigured device

### Technical
- Moved capability listener registration before configuration check in onInit
- Added deviceID check in onCapabilityOnoff and onCapabilityDim handlers

## [1.0.5] - 2025-02-13

### Added
- **Placeholder device workflow** - Devices can now be added without pre-configuration
- Device shows as "unavailable" until Device ID is configured in settings
- User-friendly workflow: Add device → Configure settings → Device becomes available
- Localized placeholder names for all device types

### Changed
- Pairing now returns a placeholder device instead of empty list
- Device settings must be configured after pairing (like Home Assistant Community app)
- Devices automatically register with app when Device ID is set

### Fixed
- Users can now actually add devices (was showing empty list before)
- Clear indication when device needs configuration

## [1.0.4] - 2025-02-13

### Fixed
- **CRITICAL**: Removed deprecated settings from app.json (SDK 3 doesn't support this)
- Added custom settings page in /settings/index.html (proper SDK 3 approach)
- Configure button now appears in Homey app
- Settings are saved using Homey.settings API

### Changed
- Settings now use custom HTML page instead of app.json schema
- Cleaner, more user-friendly settings interface

## [1.0.3] - 2025-02-12

### Fixed
- **CRITICAL**: Fixed settings validation error - changed all `label` to `title` in settings
- Cleaned up .DS_Store files
- Directory renamed to Insteon-Homey-v1.0.3 for easier version tracking

## [1.0.2] - 2025-02-12

### Fixed
- **CRITICAL**: Removed .homeycompose directory that was causing "driver.compose.json" errors
- Added missing xlarge.png images for all drivers (required by app.json)
- Removed malformed directory: {insteon-dimmer,insteon-switch,insteon-contact,insteon-leak,insteon-motion}
- Cleaned up .DS_Store and __MACOSX metadata files
- Fixed directory name to com.insteon (was "insteon")

## [1.0.1] - 2025-02-12

### Fixed
- Corrected home-controller dependency version from 2.0.6 to 0.9.2 (actual npm version)
- Fixed settings page not loading by properly structuring settings in app.json
- Updated compatibility requirement to >=12.2.0
- Fixed Insteon import statement for home-controller v0.9.2

## [1.0.0] - 2025-02-12

### Added
- Initial release of Insteon for Homey
- Support for Insteon Hub 2245 and 2242
- Direct TCP/HTTP communication with hub
- WebSocket server for real-time event updates
- Device support:
  - Dimmers and light bulbs with full dimming control
  - On/off switches
  - Contact sensors (door/window sensors)
  - Leak/water sensors
  - Motion sensors
- Fast ON/OFF command support for instant response
- Multi-language support (English, Dutch, German, Spanish, French)
- Flow cards for automation:
  - Triggers: Device turned on/off, Dim level changed
  - Actions: Turn on/off (fast)
- Configurable device settings
- Automatic reconnection with exponential backoff
- Event-driven architecture for real-time status updates

### Technical Details
- Converted from Hubitat Elevation Groovy drivers and Node.js server
- Integrated home-controller library for Insteon protocol
- WebSocket server for backward compatibility
- Unified app architecture combining parent/child driver pattern

### Notes
- Based on original work by @cwwilson08 (Chris Wilson)
- Conversion and architecture by Claude (Anthropic AI Assistant)
- Uses home-controller library by Automate Green
