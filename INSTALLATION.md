# Installation and Configuration Guide

## Prerequisites

1. **Insteon Hub** (Model 2245 or 2242)
2. **Homey Pro** (2023 or later)
3. **Network access** to both Homey and Insteon Hub
4. **Insteon Hub credentials** (username and password)

## Step 1: Prepare Your Insteon Hub

### Find Your Hub Information

1. **Hub IP Address**: 
   - Open your router's admin panel
   - Look for "Insteon Hub" or device with MAC starting with 00:1E:C0
   - Note the IP address (e.g., 192.168.1.55)

2. **Hub Credentials**:
   - Open the Insteon mobile app
   - Go to Settings → Hub Information
   - Note your username and password
   - Default username is usually your email or "admin"

3. **Hub Model**:
   - Check the label on the back of your hub
   - Model 2245 is the most common
   - Model 2242 is an older version

### Find Device IDs

For each Insteon device you want to add:

1. Physical device: Look for a label with a 6-character code (e.g., 45.ED.1C)
2. Remove the periods: 45ED1C
3. In Insteon app: Device → Settings → Device ID

**Example Device IDs:**
- Light switch: 45ED1C
- Dimmer: A1B2C3
- Sensor: FF1234

## Step 2: Install the App

1. Open Homey mobile app
2. Go to More → Apps
3. Search for "Insteon for Homey"
4. Tap Install
5. Wait for installation to complete

## Step 3: Configure Hub Connection

1. Go to More → Apps → Insteon for Homey
2. Tap Configure
3. Enter your hub information:

   ```
   Hub IP Address: 192.168.1.55
   Hub Port: 25105 (default)
   Hub Username: your_username
   Hub Password: your_password
   Hub Model: 2245 (or 2242)
   WebSocket Port: 8080 (default)
   ```

4. Tap Save
5. Check the app logs to verify connection:
   - Go to More → Apps → Insteon for Homey
   - Tap Logs
   - Look for "Connected to Insteon Hub"

## Step 4: Add Devices

### Adding a Dimmer or Light

1. Go to Devices → Add Device
2. Select "Insteon for Homey"
3. Select "Insteon Dimmer/Light" (or "Insteon Switch" for on/off only)
4. Tap Next
5. Enter device details:
   - **Name**: Kitchen Light
   - Tap Add
6. Go to device settings:
   - Device ID: 45ED1C (your device's ID)
   - Dimmable: Yes (for dimmers) or No (for switches)
   - Use Fast ON/OFF: Yes (recommended)
7. Tap Save

### Adding a Contact Sensor

1. Go to Devices → Add Device
2. Select "Insteon for Homey"
3. Select "Insteon Contact Sensor"
4. Enter device details and add
5. Go to device settings:
   - Device ID: A1B2C3 (your sensor's ID)
6. Tap Save

### Adding a Leak Sensor

Same process as contact sensor, but select "Insteon Leak Sensor"

### Adding a Motion Sensor

Same process as contact sensor, but select "Insteon Motion Sensor"

## Step 5: Test Your Devices

### For Lights/Switches:

1. Tap the device in Homey app
2. Toggle ON/OFF
3. Verify the physical device responds
4. Physically press the device
5. Verify Homey updates the status

### For Sensors:

1. Trigger the sensor (open door, detect motion, etc.)
2. Verify Homey receives the update
3. Check the device tile for status change

## Troubleshooting

### Hub Not Connecting

**Symptom**: "Not connected to Insteon hub" error

**Solutions**:
1. Verify hub IP address is correct:
   ```bash
   ping 192.168.1.55
   ```
2. Check hub is on same network as Homey
3. Verify username/password (try logging into hub web interface)
4. Ensure hub model is correct (2245 vs 2242)
5. Restart the app:
   - More → Apps → Insteon for Homey → Restart App

### Device Not Responding

**Symptom**: Device doesn't respond to commands

**Solutions**:
1. Verify Device ID is correct (6 characters, no periods)
2. Check device is linked to hub:
   - Open Insteon app
   - Verify device appears in device list
3. Test device in Insteon app first
4. Verify device has power
5. Try removing and re-adding the device

### Status Not Updating

**Symptom**: Physical device changes don't update in Homey

**Solutions**:
1. Verify hub connection is active (check app logs)
2. Ensure device is properly linked to hub
3. Check WebSocket server is running (port 8080)
4. Restart the app
5. For sensors, verify they're sending events to hub

### Dimming Not Working

**Symptom**: Light turns on/off but won't dim

**Solutions**:
1. Verify device is actually a dimmer (not just a switch)
2. Check "Dimmable" setting is enabled
3. Test dimming in Insteon app first
4. Some devices may not support dimming

## Advanced Configuration

### Using Fast Commands

Fast commands turn lights on/off instantly without ramping:

1. Go to device settings
2. Enable "Use Fast ON/OFF"
3. Save settings

**Note**: Fast commands may not work with all device types

### WebSocket Port

The WebSocket server (default port 8080) allows external integrations:

1. Only change if port 8080 is already in use
2. Update port in app settings
3. Restart app after changing

### Scene Support

To control Insteon scenes:

1. Add devices with deviceType "scene"
2. Use the group number as the device ID
3. Scene commands will affect all linked devices

## Network Requirements

- **Firewall**: Ensure ports are open:
  - 25105 (TCP) - Hub communication
  - 8080 (TCP) - WebSocket server (optional)
  
- **Static IP**: Recommended to assign static IP to hub:
  - Prevents connection loss if hub IP changes
  - Configure in router DHCP settings

## Best Practices

1. **Use descriptive names**: "Kitchen Light" vs "Light 1"
2. **Keep firmware updated**: Update hub firmware regularly
3. **Document Device IDs**: Keep a list of device IDs and locations
4. **Test after changes**: Always test after adding/modifying devices
5. **Monitor logs**: Check app logs if issues occur

## Getting Help

If you encounter issues:

1. Check app logs:
   - More → Apps → Insteon for Homey → Logs
   
2. Verify hub connection:
   - Look for "Connected to Insteon Hub" message
   
3. Test in Insteon app first:
   - Ensures device is working with hub
   
4. Report issues:
   - GitHub: https://github.com/yourusername/com.insteon/issues
   - Include logs and device information

## Example Flows

### Turn on kitchen light at sunset

**Trigger**: Sunset
**Action**: Turn on → Kitchen Light

### Fast off when leaving

**Trigger**: Someone left home
**Action**: Turn off (fast) → All lights

### Alert on leak detected

**Trigger**: Leak sensor → Water detected
**Action**: Send notification → "Water detected in bathroom!"

---

For more information, see README.md
