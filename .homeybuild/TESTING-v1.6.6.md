# Testing Guide - v1.6.6

## What to Test

### Test Connection Button

This is the primary fix in v1.6.6. The test connection button should now provide feedback.

#### Test Scenarios

**1. Test with Correct Settings (Hub 2245)**
- Enter correct hub IP
- Enter correct username
- Enter correct password
- Select "Insteon Hub 2245"
- Click "Test Connection"
- **Expected**: Green success message: "✓ Connection successful! Hub is reachable."

**2. Test with Incorrect IP (Hub Unreachable)**
- Enter incorrect IP (e.g., 192.168.50.111)
- Click "Test Connection"
- **Expected**: Red error: "Hub unreachable. Check IP address and network connection."

**3. Test with Hub Offline**
- Enter correct IP but hub powered off
- Click "Test Connection"
- **Expected**: Red error: "Connection timeout. Hub may be offline or IP address is incorrect."

**4. Test with Wrong Port**
- Enter correct IP
- Enter wrong port (e.g., 25106)
- Click "Test Connection"
- **Expected**: Red error: "Connection refused. Check port number (default: 25105)."

**5. Test Hub 2245 Without Credentials**
- Select "Insteon Hub 2245"
- Leave username blank
- Leave password blank
- Click "Test Connection"
- **Expected**: Immediate error: "Hub 2245 requires username and password"

**6. Test Hub 2242 Without Credentials**
- Select "Insteon Hub 2242"
- Leave username blank
- Leave password blank
- Enter correct IP
- Click "Test Connection"
- **Expected**: Should test connection (credentials optional for 2242)

**7. Test Timeout**
- Enter an IP that doesn't respond (firewall blocking)
- Click "Test Connection"
- **Expected**: After ~5 seconds: timeout error message

#### What to Look For

✅ **Button State Changes**
- Button text changes to "Testing..." while testing
- Button is disabled during test
- Button returns to "Test Connection" after result

✅ **Status Messages**
- Green background for success
- Red background for errors
- Clear, helpful error messages
- No generic JavaScript errors

✅ **Timing**
- Test completes within 5-10 seconds
- No infinite "Testing..." state
- Timeout message if no response

#### Debug Information

If test connection doesn't work:

1. **Check Homey App Logs**
   - Look for: "Handling test connection request..."
   - Look for: "Testing connection to: [IP]:[PORT]"
   - Look for: "Test connection result: ..."

2. **Check Settings Page Console**
   - Open browser developer tools
   - Look for JavaScript errors
   - Check for polling activity

3. **Check Settings Values**
   - Verify `testConnectionRequest` is being set
   - Verify `testConnectionResult` is being received

## Regression Testing

Please also verify these still work:

### Basic Functionality
- ✅ Hub connects on app startup
- ✅ Devices can be added
- ✅ Devices can be controlled (ON/OFF/dim)
- ✅ Real-time events work (physical button presses sync)
- ✅ Scenes can be triggered
- ✅ Flow cards work

### Settings
- ✅ Save Settings button still works
- ✅ Hub reconnects after settings change
- ✅ Debug logging works
- ✅ Hub model selection works (2245/2242)

## Known Working

From v1.6.5 base:
- All previous features
- Hub 2242 support without credentials
- Hub 2245 with required credentials
- All device types (dimmer, switch, contact, leak, motion, scene)
- Flow cards for scenes

## Version Info

- **Version**: 1.6.6
- **Date**: 2025-03-17
- **Base**: User-provided v1.6.5
- **Fix**: Test Connection button using settings-based communication
- **Semantic Versioning**: Patch (bug fix)

---

**Ready for testing!** 🧪
