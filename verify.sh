#!/bin/bash
# Verification script for Insteon app

echo "🔍 Verifying Insteon app structure..."
echo ""

# Change to app directory
cd "$(dirname "$0")"

errors=0

# Check main files
echo "📄 Checking main files..."
for file in app.json app.js package.json README.md; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file MISSING"
        ((errors++))
    fi
done

# Check no compose directory
echo ""
echo "🗂️  Checking for problematic files..."
if [ -d ".homeycompose" ]; then
    echo "  ✗ .homeycompose directory found (should not exist)"
    ((errors++))
else
    echo "  ✓ No .homeycompose directory"
fi

# Check for Mac artifacts
if find . -name ".DS_Store" -o -name "._*" | grep -q .; then
    echo "  ⚠️  Warning: Mac artifacts found (.DS_Store or ._* files)"
    echo "     Run: find . -name '.DS_Store' -delete && find . -name '._*' -delete"
else
    echo "  ✓ No Mac artifacts"
fi

# Check drivers
echo ""
echo "🚗 Checking drivers..."
for driver in insteon-dimmer insteon-switch insteon-contact insteon-leak insteon-motion; do
    if [ -d "drivers/$driver" ]; then
        if [ -f "drivers/$driver/device.js" ] && [ -f "drivers/$driver/driver.js" ]; then
            echo "  ✓ $driver (device.js + driver.js)"
        else
            echo "  ✗ $driver (missing device.js or driver.js)"
            ((errors++))
        fi
    else
        echo "  ✗ $driver directory missing"
        ((errors++))
    fi
done

# Validate JSON
echo ""
echo "📋 Validating JSON files..."
if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))" 2>/dev/null; then
        echo "  ✓ app.json valid"
    else
        echo "  ✗ app.json invalid JSON"
        ((errors++))
    fi

    if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        echo "  ✓ package.json valid"
    else
        echo "  ✗ package.json invalid JSON"
        ((errors++))
    fi
else
    echo "  ⚠️  Node.js not found - skipping JSON validation"
fi

# Check images
echo ""
echo "🖼️  Checking images..."
if [ -f "assets/images/small.png" ] && [ -f "assets/images/large.png" ]; then
    echo "  ✓ App images present"
else
    echo "  ✗ App images missing"
    ((errors++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
    echo "✅ All checks passed! App structure is correct."
    echo ""
    echo "Next steps:"
    echo "  1. npm install"
    echo "  2. homey app validate"
    echo "  3. homey app run"
else
    echo "❌ Found $errors error(s). Please fix before building."
    exit 1
fi
