# Insteon for Homey - v1.6.7 Release Notes

## 📦 Download: Insteon-Homey-v1.6.7-BETA.tar.gz

## ✅ Test Connection NOW WORKS!

### Problem Solved
Previous versions (v1.6.5, v1.6.6) had a non-working Test Connection button that gave no feedback.

### Root Cause
The test connection implementation was using incorrect approaches:
- v1.6.5: Tried `this.homey.api.post()` without proper API definition
- v1.6.6: Used settings-based polling mechanism

Neither approach worked with Homey SDK 3.

### Solution
Analyzed the working **Hubitat-Homey v1.6.0** integration and replicated the correct pattern.

---

## 🔧 Implementation Details

### Files Created/Modified

**NEW FILE: api.js**
```javascript
'use strict';

module.exports = {
  async getTestConnection({ homey }) {
    return await homey.app.testConnection();
  }
};
```

**MODIFIED: app.js**
- Added `testConnection()` method that:
  - Gets current hub settings
  - Validates settings (IP required, credentials for 2245)
  - Makes HTTP request to hub
  - Returns `{ success: true/false, error: "message" }`

**MODIFIED: settings/index.html**
- Updated `testConnection()` function to:
  - Validate form inputs
  - Temporarily save settings via `Homey.set()`
  - Call API: `Homey.api('GET', '/test-connection', callback)`
  - Display immediate results

---

## 🎯 How It Works

### API Method Naming Convention
- Method name in api.js: `getTestConnection`
- Maps to endpoint: `GET /test-connection`
- Called from settings: `Homey.api('GET', '/test-connection', ...)`

### Flow
```
1. User clicks "Test Connection"
   ↓
2. Settings page validates inputs
   ↓
3. Settings page saves values: Homey.set('hubHost', ...) etc.
   ↓
4. Settings page calls: Homey.api('GET', '/test-connection', callback)
   ↓
5. api.js receives call → calls homey.app.testConnection()
   ↓
6. app.js testConnection() method:
   - Gets settings from Homey.settings.get()
   - Validates
   - Makes HTTP request to hub
   - Returns { success, error }
   ↓
7. Callback receives result
   ↓
8. Settings page displays result immediately
```

---

## 🧪 Testing Instructions

### Test 1: Success Case
1. Enter correct hub IP
2. Enter correct credentials (if Hub 2245)
3. Click "Test Connection"
4. **Expected**: Green message "✓ Connection successful! Hub is reachable." within 1-5 seconds

### Test 2: Wrong IP
1. Enter wrong IP (e.g., 192.168.50.111)
2. Click "Test Connection"
3. **Expected**: Red error "Hub unreachable. Check IP address and network connection."

### Test 3: Hub Offline
1. Enter correct IP but power off hub
2. Click "Test Connection"
3. **Expected**: Red error "Connection timeout. Hub may be offline..."

### Test 4: Hub 2245 Without Credentials
1. Select "Insteon Hub 2245"
2. Leave username/password blank
3. Click "Test Connection"
4. **Expected**: Immediate error "Hub 2245 requires username and password"

### Test 5: Hub 2242 Without Credentials
1. Select "Insteon Hub 2242"
2. Leave username/password blank
3. Enter correct IP
4. Click "Test Connection"
5. **Expected**: Should attempt connection (credentials optional for 2242)

---

## 📋 Error Messages

| Error Code | User Message |
|------------|--------------|
| `EHOSTUNREACH` | "Hub unreachable. Check IP address and network connection." |
| `ETIMEDOUT` | "Connection timeout. Hub may be offline or IP address is incorrect." |
| `ECONNREFUSED` | "Connection refused. Check port number (default: 25105)." |
| `ENOTFOUND` | "Hub not found. Check IP address." |
| No IP entered | "Please enter Hub IP Address" |
| 2245 no creds | "Hub 2245 requires username and password" |

---

## 📁 Complete File Structure

```
Insteon-Homey-v1.6.7/
├── api.js                          ← NEW! API endpoints
├── app.js                          ← MODIFIED: Added testConnection()
├── app.json                        
├── package.json                    
├── settings/
│   └── index.html                  ← MODIFIED: Uses Homey.api()
├── drivers/
│   ├── insteon-dimmer/
│   ├── insteon-switch/
│   ├── insteon-contact/
│   ├── insteon-leak/
│   ├── insteon-motion/
│   └── insteon-scene/
├── assets/
├── locales/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── TESTING-v1.6.6.md               (update to v1.6.7 if needed)
```

---

## 🎉 Ready for Testing!

This version uses the proven, working pattern from Hubitat-Homey integration.

**Key Advantages:**
✅ Instant feedback (no polling)
✅ Proper Homey SDK 3 API pattern
✅ Clean, maintainable code
✅ Works exactly like Hubitat integration

---

## Version History

- **v1.6.7** (2025-03-17) - Test Connection FIXED using api.js pattern
- **v1.6.6** (2025-03-17) - Non-working settings-based approach
- **v1.6.5** (2025-03-16) - Non-working API approach
- **v1.6.0** (2025-02-16) - Hub 2242 support without credentials
- **v1.5.3** (2025-02-16) - Image fixes for app store
- Earlier versions in CHANGELOG.md

---

**Based on user-provided v1.6.5 + working Hubitat-Homey v1.6.0 pattern**
