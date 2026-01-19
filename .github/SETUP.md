# GitHub Actions Configuration Guide

This project uses GitHub Actions for automated testing and publishing to npm.

## Setup Instructions

### 1. Add NPM Token to GitHub Secrets

To enable automatic publishing to npm, you need to add your npm authentication token:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Your npm authentication token (get from [npmjs.com](https://www.npmjs.com/settings/~/tokens))
   - Token type: Automation (or Granular Access Token with publish permissions)
5. Click **Add secret**

### 2. Workflows

#### publish.yml
- **Trigger:** Push of git tag matching `v*` (e.g., `v0.1.0`, `v1.0.0`)
- **Steps:**
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies with Yarn
  4. Build package (`yarn build`)
  5. Publish to npm

#### test.yml
- **Trigger:** Pull requests to `main` branch
- **Steps:**
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies with Yarn
  4. Type check (`yarn types:check`)

## Release Workflow

### Step-by-step:

```bash
# 1. Make sure you're on main and everything is committed
git checkout main
git pull origin main

# 2. Update version in package.json
# Option A: Manually edit package.json
# Option B: Use npm version command
npm version patch  # bumps 0.1.0 → 0.1.1
# or
npm version minor  # bumps 0.1.0 → 0.2.0
# or
npm version major  # bumps 0.1.0 → 1.0.0

# 3. Push the version update commit
git push origin main

# 4. Create and push the version tag
git tag v0.1.1
git push origin v0.1.1

# GitHub Actions will automatically build and publish!
```

## Monitoring

Check the workflow status in your GitHub repository:
- Go to **Actions** tab to see workflow runs
- Click on a workflow run to see detailed logs

## Troubleshooting

### Publish workflow fails with "ERR! 401 Unauthorized"
- Verify `NPM_TOKEN` is set correctly in GitHub Secrets
- Ensure the token has publish permissions

### Type check fails in PR
- Run `yarn types:check` locally to debug type issues
- Fix TypeScript errors before pushing

### Build fails
- Run `yarn build` locally to debug
- Ensure all dependencies are installed with `yarn install`
