# tools/activate-profile.ps1
# Activates a specific AI profile by installing its skills.

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("DevOps", "Backend", "UI", "Docs")]
    [string]$Profile
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$VendorDir = Join-Path $ScriptDir "..\.claude\vendor"
$SkillDir = Join-Path $ScriptDir "..\.agent\skills"

function Log-Action {
    param([string]$Message)
    $Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Date] [PROFILE: $Profile] $Message"
}

Log-Action "Activating profile..."

# Dictionary Mapping Profiles to Skills (Paths relative to vendor)
$ProfileMap = @{
    "DevOps"  = @(
        "antigravity-awesome-skills\skills\docker-expert",
        "antigravity-awesome-skills\skills\server-management",
        "antigravity-awesome-skills\skills\incident-response-incident-response",
        "antigravity-awesome-skills\skills\bash-pro",
        "antigravity-awesome-skills\skills\aws-skills"
    )
    "Backend" = @(
        "antigravity-awesome-skills\skills\api-design-principles",
        "antigravity-awesome-skills\skills\database-design",
        "antigravity-awesome-skills\skills\python-pro",
        "antigravity-awesome-skills\skills\nodejs-backend-patterns",
        "antigravity-awesome-skills\skills\testing-patterns"
    )
    "UI"      = @(
        "ui-ux-pro-max-skill\.claude\skills\ui-ux-pro-max",
        "antigravity-awesome-skills\skills\react-best-practices",
        "antigravity-awesome-skills\skills\tailwind-patterns",
        "antigravity-awesome-skills\skills\css-wizard"
    )
    "Docs"    = @(
        "antigravity-awesome-skills\skills\docs-architect",
        "antigravity-awesome-skills\skills\technical-writing",
        "antigravity-awesome-skills\skills\readme",
        "antigravity-awesome-skills\skills\copy-editing"
    )
}

$SkillsToInstall = $ProfileMap[$Profile]

if ($null -eq $SkillsToInstall) {
    Write-Error "Profile '$Profile' not found in mapping."
}

# Copy skills
foreach ($SkillRelPath in $SkillsToInstall) {
    $Source = Join-Path $VendorDir $SkillRelPath
    if (Test-Path $Source) {
        $SkillName = Split-Path $Source -Leaf
        $Dest = Join-Path $SkillDir $SkillName
        
        if (-not (Test-Path $Dest)) {
            Log-Action "Installing skill: $SkillName"
            Copy-Item -Path $Source -Destination $Dest -Recurse -Force
        }
        else {
            Log-Action "Skill already active: $SkillName"
        }
    }
    else {
        Log-Action "Warning: Skill not found: $SkillRelPath"
    }
}

Log-Action "Profile '$Profile' activated successfully."
