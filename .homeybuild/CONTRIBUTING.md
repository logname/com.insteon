# Contributing to Insteon for Homey

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- **Node.js** >= 16.0.0
- **Homey CLI**: Install globally with `npm install -g homey`
- **Homey Pro** with firmware 12.2.0 or higher
- **Insteon Hub** (2245/2242) for testing

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/com.insteon.git
cd com.insteon

# Install dependencies
npm install

# Log in to Homey
homey login

# Select your Homey
homey select
```

## Homey CLI Commands

### Validation & Testing

```bash
# Validate app structure and manifest
homey app validate

# Run app in development mode (live reload on file changes)
homey app run

# Install app on your Homey
homey app install

# View app in Homey Developer Tools
homey app manage
```

### Building & Publishing

```bash
# Build app for publishing
homey app build

# Update app version
homey app version patch   # 1.5.2 -> 1.5.3
homey app version minor   # 1.5.2 -> 1.6.0
homey app version major   # 1.5.2 -> 2.0.0

# Publish to Homey App Store (requires approval)
homey app publish

# View app in Homey App Store
homey app view
```

### Advanced Commands

```bash
# Add GitHub Workflows (validate, update version, publish)
homey app add-github-workflows

# Install Apps SDK TypeScript declarations
homey app add-types

# Migrate app to Homey compose
homey app compose

# Translate app with OpenAI
homey app translate

# Driver-related commands
homey app driver --help

# Flow-related commands
homey app flow --help

# Widget-related commands
homey app widget --help

# Discovery-related commands
homey app discovery --help
```

## Development Workflow

### 1. Make Changes

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes
# Edit files...

# Validate changes
homey app validate
```

### 2. Test Changes

```bash
# Run in development mode (live reload)
homey app run

# Or install on Homey
homey app install

# Test your changes on actual hardware
```

### 3. Version & Commit

```bash
# Update version (follows semantic versioning)
homey app version patch  # Bug fixes
homey app version minor  # New features
homey app version major  # Breaking changes

# Commit changes
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/my-feature
```

### 4. Submit Pull Request

Create a pull request on GitHub with:
- Clear description of changes
- Test results
- Screenshots (if UI changes)

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (1.x.0): New features (backward compatible)
- **PATCH** (1.5.x): Bug fixes

Examples:
- Fix bug: `1.5.2 → 1.5.3` (patch)
- Add feature: `1.5.2 → 1.6.0` (minor)
- Breaking change: `1.5.2 → 2.0.0` (major)

## Code Style

### JavaScript/Node.js

- Use ES6+ features
- Use `const` and `let` (not `var`)
- Use async/await (not callbacks)
- Add comments for complex logic
- Follow existing code style

### File Structure

```
com.insteon/
├── app.js                 # Main app file
├── app.json               # Manifest
├── drivers/
│   ├── insteon-dimmer/    # Dimmer driver
│   ├── insteon-switch/    # Switch driver
│   ├── insteon-contact/   # Contact sensor
│   ├── insteon-leak/      # Leak sensor
│   ├── insteon-motion/    # Motion sensor
│   └── insteon-scene/     # Scene controller
├── locales/               # Translations
├── settings/              # App settings page
└── assets/                # Images/icons
```

## Testing Guidelines

### Manual Testing

1. **Hub Connection**
   - Test with correct credentials
   - Test with wrong credentials
   - Test network disconnection

2. **Device Control**
   - Test ON/OFF commands
   - Test dimming (for dimmers)
   - Test fast commands
   - Test scene activation

3. **Event Handling**
   - Physical device changes
   - Hub-initiated changes
   - Multiple rapid changes

4. **Flow Cards**
   - Test scene actions
   - Test with various scene numbers

### Test Checklist

- [ ] App installs without errors
- [ ] Hub connection works
- [ ] Devices can be added
- [ ] Device control works (ON/OFF/dim)
- [ ] Real-time events sync
- [ ] Scenes activate correctly
- [ ] Flow cards work
- [ ] Settings page loads
- [ ] Debug logging works
- [ ] App doesn't crash

## Debugging

### Enable Debug Logging

1. Open app settings
2. Enable "Debug Logging"
3. Watch logs in real-time
4. Reproduce issue
5. Copy relevant logs

### Common Issues

**App Won't Start**
```bash
# Check logs
homey app run --verbose

# Validate manifest
homey app validate

# Check Node.js version
node --version  # Should be >= 16
```

**Device Not Responding**
- Check device ID format (6 hex chars)
- Verify device is paired with hub
- Test from hub's web interface
- Check debug logs for events

**Events Not Working**
- Verify hub connection
- Check device registration
- Enable debug logging
- Look for event messages in logs

## Documentation

When adding features:
1. Update README.md with usage examples
2. Add entry to CHANGELOG.md
3. Update TECHNICAL.md if architecture changes
4. Add translations to locales/*.json

## Questions?

- **Issues**: [GitHub Issues](https://github.com/yourusername/com.insteon/issues)
- **Discussions**: [Homey Community Forum](https://community.homey.app)

## Code of Conduct

- Be respectful and constructive
- Help others learn and grow
- Focus on what's best for the community
- Show empathy towards other contributors

## License

By contributing, you agree that your contributions will be licensed under GPL-3.0.

---

Thank you for contributing! 🎉
