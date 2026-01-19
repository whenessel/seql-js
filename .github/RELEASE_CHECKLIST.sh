#!/bin/bash
# Quick reference for releasing a new version

echo "Release Checklist:"
echo "================="
echo "1. Make sure you're on main branch: git checkout main"
echo "2. Update version in package.json"
echo "3. Commit: git add package.json && git commit -m 'chore: bump version to v0.x.x'"
echo "4. Create tag: git tag v0.x.x"
echo "5. Push: git push origin main && git push origin v0.x.x"
echo ""
echo "GitHub Actions will automatically:"
echo "  ✓ Build the package"
echo "  ✓ Run type checking"
echo "  ✓ Publish to npm"
echo ""
echo "Monitor at: https://github.com/whenessel/seql-js/actions"
