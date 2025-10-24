# Galactic Frontier Development Scripts

This directory contains automation scripts for development workflows.

## 🚀 Release Workflow Script (`release-workflow.sh`)

**Purpose:** Interactive script to perform the complete Git release workflow from development to production.

### Workflow Performed:
1. ✅ Validates you're on `dev` branch with uncommitted changes
2. 📝 Prompts for commit message
3. 🔄 Executes complete workflow:
   - Stages all changes (`git add .`)
   - Commits to `dev` branch
   - Pushes `dev` to origin
   - Switches to `main` branch
   - Merges `dev` into `main` (no editor prompt)
   - Pushes `main` to origin
   - Returns to `dev` branch

### Usage:

```bash
# Can run from anywhere, but recommended to run from project root
./devScripts/release-workflow.sh

# Or run from devScripts directory (script will auto-detect and cd to project root)
cd devScripts
./release-workflow.sh
```

### Interactive Flow:
```
🚀 Galactic Frontier Release Workflow
====================================
🔍 Checking current status...
✅ Ready to proceed with release workflow

📝 Enter your commit message:
feat: complete Phase 1 - core game mechanics enhancement

🎯 Starting release workflow...
[executes all steps automatically]
```

### Safety Features:
- ✅ Validates current branch is `dev`
- ✅ Ensures uncommitted changes exist
- ✅ Uses `--no-edit` flag to prevent merge commit editor prompts
- ✅ Stops on any Git command failure
- ✅ Clear error messages and status updates

### What Happens Next:
- Production server runs `deploy.sh` (pulls from `main`)
- Game automatically deploys to `galacticfrontier.h2mcore.ai`

### Error Handling:
- Not on `dev` branch → Clear error message
- No changes to commit → Clear error message
- Empty commit message → Rejected
- Any Git command fails → Script stops with error

### Example Output:
```
🎉 Release workflow completed successfully!
==========================================
📊 Summary:
   • Changes committed to dev branch
   • Dev branch pushed to GitHub
   • Dev branch merged into main
   • Main branch pushed to GitHub
   • Switched back to dev branch for continued development

🚀 Production server will auto-deploy via deploy.sh
🌐 Game available at: galacticfrontier.h2mcore.ai
```

---

## 🎮 Development Workflow

1. **Daily Development:** Work on `dev` branch
2. **Ready for Release:** Run `./devScripts/release-workflow.sh`
3. **Production Deploy:** Automatic via GitHub webhook → `deploy.sh`

**Happy coding!** 🚀✨
