# Quick Start Guide - Insteon for Homey

Get up and running with Insteon for Homey in 5 minutes!

## Prerequisites ✓

- [ ] Homey Pro (2023 or later)
- [ ] Insteon Hub 2245 or 2242
- [ ] Hub IP address
- [ ] Hub username and password
- [ ] Device IDs for your Insteon devices

## Step 1: Install App (2 min)

1. Open Homey app
2. Go to **More** → **Apps**
3. Search "**Insteon for Homey**"
4. Tap **Install**
5. Wait for completion

## Step 2: Configure Hub (1 min)

1. Go to **More** → **Apps** → **Insteon for Homey**
2. Tap **Configure**
3. Enter:
   - Hub IP: `192.168.1.55` (your hub's IP)
   - Port: `25105`
   - Username: `your_username`
   - Password: `your_password`
   - Model: `2245` (or 2242)
4. Tap **Save**

**Verify:** Check logs for "Connected to Insteon Hub"

## Step 3: Add Your First Device (2 min)

### For a Light/Dimmer:

1. **Devices** → **Add Device** → **Insteon for Homey**
2. Select **Insteon Dimmer/Light**
3. Tap **Next** → **Add**
4. Go to device settings:
   - Device ID: `45ED1C` (your device's 6-char ID)
   - Dimmable: ✓ (if dimmer) or ✗ (if switch)
   - Fast Commands: ✓ (recommended)
5. Tap **Save**

### For a Sensor:

Same process, but select the sensor type and only enter Device ID.

## Step 4: Test It! (30 sec)

1. Tap the device in Homey
2. Toggle ON/OFF
3. Verify light responds
4. Press physical button
5. Verify Homey updates

**Success!** Your Insteon device is now controlled by Homey!

## Common Device IDs Format

✓ Correct: `45ED1C`, `A1B2C3`, `FF1234`
✗ Wrong: `45.ED.1C`, `45-ed-1c`, `45 ED 1C`

(Remove periods/dashes, use uppercase)

## Finding Your Hub IP

### Method 1: Router
1. Log into router
2. Look for "Insteon Hub"
3. Note the IP address

### Method 2: Insteon App
1. Open Insteon app
2. Settings → Hub Info
3. Note IP address

## Finding Device IDs

### Physical Device
Look for label with format: `45.ED.1C`
Remove periods: `45ED1C`

### Insteon App
Device → Settings → Device ID

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Hub won't connect | Verify IP, username, password |
| Device won't respond | Check Device ID format |
| Status not updating | Verify hub connection active |

## Need Help?

📖 **Full Guide:** See INSTALLATION.md
🔧 **Technical:** See TECHNICAL.md
🐛 **Issues:** GitHub Issues
📝 **Logs:** More → Apps → Insteon → Logs

## Next Steps

✓ Add more devices
✓ Create Flows for automation
✓ Set up scenes
✓ Enjoy your Insteon devices in Homey!

---

**Tip:** Use Fast Commands for instant response when turning lights on/off!
