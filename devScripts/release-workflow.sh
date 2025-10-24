#!/bin/bash

# Galactic Frontier Release Workflow Script
# Interactive script to commit to dev, push dev, merge to main, push main, and return to dev

set -e  # Exit on any error

echo "🚀 Galactic Frontier Release Workflow"
echo "===================================="

# Function to check if we're on dev branch
check_dev_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "dev" ]; then
        echo "❌ Error: You are not on the 'dev' branch."
        echo "   Current branch: $current_branch"
        echo "   Please switch to dev branch first: git checkout dev"
        exit 1
    fi
}

# Function to check for uncommitted changes
check_uncommitted_changes() {
    if [ -z "$(git status --porcelain)" ]; then
        echo "❌ No uncommitted changes found."
        echo "   Make some changes first, then run this script."
        exit 1
    fi
}

# Function to execute git commands with error handling
execute_git_command() {
    local cmd="$1"
    local description="$2"

    echo "📋 $description..."
    if eval "$cmd"; then
        echo "✅ $description - Success"
    else
        echo "❌ $description - Failed"
        exit 1
    fi
    echo ""
}

# Main workflow
main() {
    # Ensure we're in project root directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

    echo "📁 Changing to project root: $PROJECT_ROOT"
    cd "$PROJECT_ROOT" || {
        echo "❌ Error: Could not change to project root directory"
        exit 1
    }

    # Initial checks
    echo "🔍 Checking current status..."
    check_dev_branch
    check_uncommitted_changes

    echo "✅ Ready to proceed with release workflow"
    echo ""

    # Get commit message from user
    echo "📝 Enter your commit message:"
    echo "(Press Enter when done)"
    read -r commit_message

    if [ -z "$commit_message" ]; then
        echo "❌ Error: Commit message cannot be empty"
        exit 1
    fi

    echo ""
    echo "🎯 Starting release workflow with message: '$commit_message'"
    echo "=========================================================="

    # Step 1: Stage all changes
    execute_git_command "git add ." "Staging all changes"

    # Step 2: Commit with user message
    execute_git_command "git commit -m '$commit_message'" "Committing changes to dev branch"

    # Step 3: Push dev branch
    execute_git_command "git push origin dev" "Pushing dev branch to origin"

    # Step 4: Switch to main branch
    execute_git_command "git checkout main" "Switching to main branch"

    # Step 5: Merge dev into main
    execute_git_command "git merge dev" "Merging dev into main"

    # Step 6: Push main branch
    execute_git_command "git push origin main" "Pushing main branch to origin"

    # Step 7: Switch back to dev branch
    execute_git_command "git checkout dev" "Switching back to dev branch for continued development"

    echo ""
    echo "🎉 Release workflow completed successfully!"
    echo "=========================================="
    echo "📊 Summary:"
    echo "   • Changes committed to dev branch"
    echo "   • Dev branch pushed to GitHub"
    echo "   • Dev branch merged into main"
    echo "   • Main branch pushed to GitHub"
    echo "   • Switched back to dev branch"
    echo ""
    echo "🚀 Production server will auto-deploy via deploy.sh"
    echo "🌐 Game available at: galacticfrontier.h2mcore.ai"
    echo ""
    echo "Happy coding! 🎮✨"
}

# Run main function
main
