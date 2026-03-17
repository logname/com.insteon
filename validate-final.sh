#!/bin/bash
echo "=== Final Structure Validation ==="
echo ""

ERRORS=0
WARNINGS=0

# Check .homeycompose does NOT exist
if [ -d ".homeycompose" ]; then
  echo "✗ CRITICAL: .homeycompose directory exists (must be removed!)"
  ((ERRORS++))
else
  echo "✓ No .homeycompose directory (correct)"
fi

# Check for .compose.json files
if find . -name "*.compose.json" | grep -q .; then
  echo "✗ CRITICAL: Found .compose.json files (should not exist)"
  find . -name "*.compose.json"
  ((ERRORS++))
else
  echo "✓ No .compose.json files (correct)"
fi

# Check driver files
echo ""
echo "Checking drivers..."
for driver in insteon-dimmer insteon-switch insteon-contact insteon-leak insteon-motion; do
  echo "  $driver:"
  [ -f "drivers/$driver/device.js" ] && echo "    ✓ device.js" || { echo "    ✗ device.js"; ((ERRORS++)); }
  [ -f "drivers/$driver/driver.js" ] && echo "    ✓ driver.js" || { echo "    ✗ driver.js"; ((ERRORS++)); }
  [ -f "drivers/$driver/assets/images/small.png" ] && echo "    ✓ small.png" || { echo "    ✗ small.png"; ((ERRORS++)); }
  [ -f "drivers/$driver/assets/images/large.png" ] && echo "    ✓ large.png" || { echo "    ✗ large.png"; ((ERRORS++)); }
  [ -f "drivers/$driver/assets/images/xlarge.png" ] && echo "    ✓ xlarge.png" || { echo "    ✗ xlarge.png"; ((ERRORS++)); }
done

# Check for .DS_Store files (warning only)
echo ""
if find . -name ".DS_Store" | grep -q .; then
  echo "⚠ Warning: .DS_Store files found (harmless but should be cleaned)"
  ((WARNINGS++))
else
  echo "✓ No .DS_Store files"
fi

# Summary
echo ""
echo "=== Summary ==="
if [ $ERRORS -eq 0 ]; then
  echo "✓ All checks passed! Structure is correct."
  [ $WARNINGS -gt 0 ] && echo "⚠ $WARNINGS warning(s) (non-critical)"
  exit 0
else
  echo "✗ Found $ERRORS error(s). Fix before installing."
  exit 1
fi
