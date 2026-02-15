#!/bin/bash
# tools/setup-ai.sh
# AI Skills Setup Script for Linux/Mac

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="$SCRIPT_DIR/../.claude/vendor"
SKILL_DIR="$SCRIPT_DIR/../.agent/skills"
CLAUDE_SKILL_DIR="$SCRIPT_DIR/../.claude/skills"
LOG_FILE="$SCRIPT_DIR/../docs/SETUP-LOG.md"

mkdir -p "$VENDOR_DIR"
mkdir -p "$SKILL_DIR"
mkdir -p "$CLAUDE_SKILL_DIR"

log_action() {
    local message="$1"
    local date=$(date "+%Y-%m-%d %H:%M:%S")
    echo "| $date | Setup Script (Bash) | $message |" >> "$LOG_FILE"
    echo "[SETUP] $message"
}

clone_repo() {
    local url="$1"
    local name="$2"
    local target="$VENDOR_DIR/$name"
    
    if [ -d "$target" ]; then
        log_action "Repo '$name' already exists. Skipping clone."
    else
        log_action "Cloning '$name' from $url..."
        git clone "$url" "$target"
    fi
}

copy_skill() {
    local src_rel="$1"
    local dest_dir="$2"
    local src="$VENDOR_DIR/$src_rel"
    local name=$(basename "$src")
    local dest="$dest_dir/$name"
    
    if [ -d "$src" ]; then
        if [ ! -d "$dest" ]; then
            log_action "Copying skill '$name'..."
            cp -r "$src" "$dest"
        fi
    else
        log_action "Warning: Skill source not found at $src"
    fi
}

# 1. Clone
clone_repo "https://github.com/sickn33/antigravity-awesome-skills" "antigravity-awesome-skills"
clone_repo "https://github.com/obra/superpowers" "superpowers"
clone_repo "https://github.com/google-labs-code/stitch-skills" "stitch-skills"
clone_repo "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" "ui-ux-pro-max-skill"
clone_repo "https://github.com/centminmod/my-claude-code-setup" "my-claude-code-setup"
clone_repo "https://github.com/hesreallyhim/awesome-claude-code" "awesome-claude-code"
clone_repo "https://github.com/feiskyer/claude-code-settings" "claude-code-settings"

# 2. Curation
log_action "Curating minimal skill set..."

# Antigravity Skills
AG_SKILLS=(
    "antigravity-awesome-skills/skills/python-pro"
    "antigravity-awesome-skills/skills/javascript-pro"
    "antigravity-awesome-skills/skills/typescript-pro"
    "antigravity-awesome-skills/skills/docker-expert"
    "antigravity-awesome-skills/skills/git-advanced-workflows"
    "antigravity-awesome-skills/skills/server-management"
    "antigravity-awesome-skills/skills/systematic-debugging"
    "superpowers/skills/writing-plans"
    "superpowers/skills/executing-plans"
    "superpowers/skills/brainstorming"
)

for skill in "${AG_SKILLS[@]}"; do
    copy_skill "$skill" "$SKILL_DIR"
done

# Claude Skills
CLAUDE_SKILLS=(
    "ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max"
    "superpowers/skills/writing-plans"
    "superpowers/skills/executing-plans"
    "superpowers/skills/brainstorming"
)

for skill in "${CLAUDE_SKILLS[@]}"; do
    copy_skill "$skill" "$CLAUDE_SKILL_DIR"
done

log_action "Setup complete."
