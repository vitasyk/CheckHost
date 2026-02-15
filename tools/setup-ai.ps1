# tools/setup-ai.ps1
# AI Skills Setup Script
# Clones vendor repositories and sets up the environment.

$ErrorActionPreference = "Stop"

$VendorDir = Join-Path $PSScriptRoot "..\.claude\vendor"
$SkillDir = Join-Path $PSScriptRoot "..\.agent\skills"
$ClaudeSkillDir = Join-Path $PSScriptRoot "..\.claude\skills"
$DocsDir = Join-Path $PSScriptRoot "..\docs"
$LogFile = Join-Path $DocsDir "SETUP-LOG.md"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $VendorDir, $SkillDir, $ClaudeSkillDir | Out-Null

function Log-Action {
    param([string]$Message)
    $Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "| $Date | Setup Script | $Message |"
    Add-Content -Path $LogFile -Value $LogEntry
    Write-Host "[SETUP] $Message"
}

function Clone-Repo {
    param([string]$Url, [string]$Name)
    $Target = Join-Path $VendorDir $Name
    if (Test-Path $Target) {
        Log-Action "Repo '$Name' already exists. Skipping clone."
    }
    else {
        Log-Action "Cloning '$Name' from $Url..."
        git clone $Url $Target
    }
}

# 1. Clone Repositories
Clone-Repo "https://github.com/sickn33/antigravity-awesome-skills" "antigravity-awesome-skills"
Clone-Repo "https://github.com/obra/superpowers" "superpowers"
Clone-Repo "https://github.com/google-labs-code/stitch-skills" "stitch-skills"
Clone-Repo "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" "ui-ux-pro-max-skill"
Clone-Repo "https://github.com/centminmod/my-claude-code-setup" "my-claude-code-setup"
Clone-Repo "https://github.com/hesreallyhim/awesome-claude-code" "awesome-claude-code"
Clone-Repo "https://github.com/feiskyer/claude-code-settings" "claude-code-settings"


# 2. Curation - Copy Minimal Skill Set

function Copy-Skill {
    param([string]$SourcePath, [string]$DestinationDir)
    if (Test-Path $SourcePath) {
        $SkillName = Split-Path $SourcePath -Leaf
        $Dest = Join-Path $DestinationDir $SkillName
        if (-not (Test-Path $Dest)) {
            Log-Action "Copying skill '$SkillName'..."
            Copy-Item -Path $SourcePath -Destination $Dest -Recurse -Force
        }
    }
    else {
        Log-Action "Warning: Skill source not found at $SourcePath"
    }
}

Log-Action "Curating minimal skill set..."

# Antigravity Skills (curated subset)
$AG_Skills = @(
    "antigravity-awesome-skills\skills\python-pro",
    "antigravity-awesome-skills\skills\javascript-pro",
    "antigravity-awesome-skills\skills\typescript-pro",
    "antigravity-awesome-skills\skills\docker-expert",
    "antigravity-awesome-skills\skills\git-advanced-workflows",
    "antigravity-awesome-skills\skills\server-management",
    "antigravity-awesome-skills\skills\systematic-debugging",
    "superpowers\skills\writing-plans",
    "superpowers\skills\executing-plans",
    "superpowers\skills\brainstorming"
)

foreach ($SkillPath in $AG_Skills) {
    Copy-Skill (Join-Path $VendorDir $SkillPath) $SkillDir
}

# Claude Skills (UI + Workflow)
$Claude_Skills = @(
    "ui-ux-pro-max-skill\.claude\skills\ui-ux-pro-max",
    "superpowers\skills\writing-plans",
    "superpowers\skills\executing-plans",
    "superpowers\skills\brainstorming"
)

foreach ($SkillPath in $Claude_Skills) {
    Copy-Skill (Join-Path $VendorDir $SkillPath) $ClaudeSkillDir
}

Log-Action "Setup complete. Skills installed in .agent/skills and .claude/skills."
