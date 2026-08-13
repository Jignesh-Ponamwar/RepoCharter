# Windows public-consumer end-to-end verification

This guide verifies the public `repo-charter@0.1.3` package and the GitHub-installed
RepoCharter skill as a Windows user would consume them. It deliberately avoids this
source checkout after setup: the CLI comes from npm, and the skill comes from Skills
CLI.

Run it in a disposable Windows PowerShell session, VM, sandbox, or separate test
account. It creates temporary repositories and may install the global skill for the
current Windows user.

## What this verifies

- npm registry availability and public package version;
- version-pinned one-command `npx` initialization from a clean repository;
- installation without lifecycle scripts;
- installed Windows `.cmd` CLI help, `init`, workflow preview/apply, `check`, and
  read-only drift check;
- both `local-planning` and `shared-planning` visibility behavior in new and existing
  Git repositories;
- Skills CLI discovery/installation; and
- the globally installed skill wrapper invoking the public CLI, not this source
  checkout.

It does **not** prove that Codex, Claude Code, Copilot, Cursor, Windsurf, Gemini CLI,
or another agent platform follows the generated instructions. That needs a separate
fresh-agent behavior evaluation.

## 1. Preconditions and isolated harness

Confirm Node.js 22+ and npm are available:

```powershell
node --version
npm --version
```

Confirm the published version before installing it:

```powershell
npm view repo-charter@0.1.3 version --prefer-online
```

Expected output:

```text
0.1.3
```

Create one disposable test root. First verify the one-command public experience from a
clean repository outside a RepoCharter source checkout:

```powershell
$root = Join-Path $env:TEMP "repo-charter-e2e-$([guid]::NewGuid())"
$npxTarget = Join-Path $root 'npx-target'
New-Item -ItemType Directory -Force $npxTarget | Out-Null
@'{ "name": "repo-charter-npx-e2e", "private": true }'@ | Set-Content "$npxTarget\package.json"
Push-Location $npxTarget
try {
  npx --yes repo-charter@0.1.3 init . --primary-agent codex --json
  if (-not (Test-Path '.repo-charter\manifest.json')) { throw 'npx init did not create a session manifest.' }
} finally {
  Pop-Location
}
```

`npx` intentionally downloads and executes the pinned package. Do not run this command
from a RepoCharter source checkout: npm recognizes the checkout as the same package and
does not create a second temporary package bin path. Use `node bin/repo-charter.js` for
source development instead.

Next, install the public package into a dedicated harness to test the normal installed
Windows `.cmd` binary. `--ignore-scripts` prevents lifecycle scripts; `--no-package-lock`
keeps the harness isolated from lockfile changes.

```powershell
$harness = Join-Path $root 'harness'
New-Item -ItemType Directory -Force $harness | Out-Null
npm install --ignore-scripts --no-save --no-package-lock --prefix $harness repo-charter@0.1.3
$cli = (Resolve-Path "$harness\node_modules\.bin\repo-charter.cmd").Path
& $cli --help
```

Expected: help lists `init`, `check`, `resume`, `drift-check`,
`drift-acknowledge`, and `workflow`.

## 2. Shared test helpers

Run these helper functions once in the same PowerShell session:

```powershell
function New-RepoCharterFixture {
  param(
    [Parameter(Mandatory)] [string] $Path,
    [switch] $Existing
  )

  New-Item -ItemType Directory -Force $Path | Out-Null
  Push-Location $Path
  try {
    git init | Out-Host
    git config user.email 'repo-charter-e2e@example.invalid'
    git config user.name 'RepoCharter E2E'

    @'{
  "name": "repo-charter-e2e-fixture",
  "private": true,
  "type": "module"
}
'@ | Set-Content -NoNewline package.json

    if ($Existing) {
      New-Item -ItemType Directory -Force src | Out-Null
      'export const greeting = "hello";' | Set-Content -NoNewline src/index.js
      "# Existing user rule`nuser-local.txt" | Set-Content -NoNewline .gitignore
    }

    git add package.json
    if ($Existing) { git add .gitignore src }
    git commit -m 'Initial fixture' | Out-Host
  } finally {
    Pop-Location
  }
}

function Set-ApprovedSpecification {
  param(
    [Parameter(Mandatory)] [string] $Path,
    [Parameter(Mandatory)] [ValidateSet('local-planning', 'shared-planning')] [string] $Mode
  )

  @{
    selectedAgents = @{ primary = 'claude-code'; secondary = @() }
    workspaceVisibility = $Mode
    verificationDepth = 'static'
    confirmedDecisions = @{}
  } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $Path 'approved-spec.json')

  @{ approveSafe = $true } | ConvertTo-Json | Set-Content (Join-Path $Path 'approvals.json')
}

function Assert-Visibility {
  param(
    [Parameter(Mandatory)] [string] $Path,
    [Parameter(Mandatory)] [ValidateSet('local-planning', 'shared-planning')] [string] $Mode
  )

  Push-Location $Path
  try {
    foreach ($required in 'AGENTS.md', 'PLAN.md', 'TODO.md', 'CLAUDE.md', '.repo-charter\manifest.json') {
      if (-not (Test-Path $required)) { throw "Expected $required to exist." }
    }

    if (-not (git check-ignore -q '.repo-charter/manifest.json')) {
      throw '.repo-charter/manifest.json must be ignored.'
    }
    if (git check-ignore -q 'AGENTS.md') {
      throw 'AGENTS.md must not be ignored.'
    }

    $planIsIgnored = git check-ignore -q 'PLAN.md'
    if ($Mode -eq 'local-planning' -and -not $planIsIgnored) {
      throw 'PLAN.md must be ignored in local-planning.'
    }
    if ($Mode -eq 'shared-planning' -and $planIsIgnored) {
      throw 'PLAN.md must not be ignored in shared-planning.'
    }
  } finally {
    Pop-Location
  }
}
```

## 3. Verify a new repository in both visibility modes

Run this once for each mode:

```powershell
foreach ($mode in 'local-planning', 'shared-planning') {
  $target = Join-Path $root "new-$mode"
  New-RepoCharterFixture -Path $target
  Set-ApprovedSpecification -Path $target -Mode $mode

  & $cli init $target --primary-agent claude-code --json
  & $cli workflow preview $target "$target\approved-spec.json" --json
  & $cli workflow apply $target "$target\approved-spec.json" "$target\approvals.json" --json
  & $cli check $target --json
  & $cli drift-check $target --json

  Assert-Visibility -Path $target -Mode $mode
}
```

Expected:

- `init` reports an `handoff-ready` session without running fixture scripts;
- preview lists `AGENTS.md`, `PLAN.md`, `TODO.md`, `CLAUDE.md`, and the managed
  `.gitignore` change;
- apply reports only approved changes and `reconciled` drift status;
- `check` reports the setup without writing;
- `drift-check` is read-only and reports an in-sync or otherwise clearly classified
  anchor result; and
- `PLAN.md` is ignored only in `local-planning`, while `AGENTS.md` is never ignored.

## 4. Verify an existing repository preserves user content

This fixture has existing source code and a user-owned `.gitignore` prefix. Run both
modes again:

```powershell
foreach ($mode in 'local-planning', 'shared-planning') {
  $target = Join-Path $root "existing-$mode"
  New-RepoCharterFixture -Path $target -Existing
  Set-ApprovedSpecification -Path $target -Mode $mode

  & $cli init $target --primary-agent claude-code --json
  & $cli workflow preview $target "$target\approved-spec.json" --json
  & $cli workflow apply $target "$target\approved-spec.json" "$target\approvals.json" --json
  & $cli check $target --json

  if (-not (Select-String -Quiet -Path "$target\.gitignore" -Pattern '^# Existing user rule$')) {
    throw 'RepoCharter did not preserve the user-owned .gitignore prefix.'
  }
  if (-not (Test-Path "$target\src\index.js")) {
    throw 'RepoCharter did not preserve existing source.'
  }

  Assert-Visibility -Path $target -Mode $mode
}
```

A conflict or unexpected project-owned file must remain pending/preserved until an
explicit per-file decision is supplied. Do not treat a conflict as a reason to delete
or overwrite the existing file.

## 5. Verify the installed skill uses the public CLI

This step performs an explicit network operation and installs a global skill for the
current Windows user. Run it in the disposable test environment only:

```powershell
npx skills add Jignesh-Ponamwar/RepoCharter@repo-charter -g -y --skill repo-charter
npx skills list -g --json
```

Expected: a global `repo-charter` skill is listed for supported skill consumers. A
PromptScript-specific message that global skill installation is unsupported is an
installer limitation, not a RepoCharter CLI failure.

Point the installed skill wrapper at the **public harness CLI**. Do not point it at
`node bin/repo-charter.js` from a source checkout:

```powershell
$env:REPO_CHARTER_CLI = $cli
$skillScript = Join-Path $env:USERPROFILE '.agents\skills\repo-charter\scripts\workflow.mjs'
if (-not (Test-Path $skillScript)) { throw "Installed skill script not found: $skillScript" }

$target = Join-Path $root 'skill-public-cli'
New-RepoCharterFixture -Path $target
Set-ApprovedSpecification -Path $target -Mode 'local-planning'

& $cli init $target --primary-agent claude-code --json
node $skillScript preview $target "$target\approved-spec.json"
node $skillScript apply $target "$target\approved-spec.json" "$target\approvals.json"
& $cli check $target --json
Assert-Visibility -Path $target -Mode 'local-planning'
```

Expected: preview and apply return JSON from the public CLI, the skill wrapper imports
no repository-relative `src/` module, and `check` succeeds without source-checkout
coupling.

### Missing-CLI guidance check

In a separate PowerShell process with neither `repo-charter` on `PATH` nor
`REPO_CHARTER_CLI` set, run the installed skill wrapper preview command. It must fail
without writing and explain that the developer must explicitly install
`repo-charter@0.1.3` or approve a versioned `npx` invocation. Do not approve an
installation solely for this negative test.

## 6. Record results and clean up

Record the actual Windows version, Node version, npm version, public package version,
command outcomes, mode-specific visibility observations, Skills CLI outcome, and any
blockers in the appropriate `TODO.md` task or verification log. Do not record a check
as passed unless you observed it.

Remove the disposable test files when finished:

```powershell
Remove-Item $root -Recurse -Force
Remove-Item Env:REPO_CHARTER_CLI -ErrorAction SilentlyContinue
```

If you installed the global skill only for this test, remove it using the Skills CLI
command documented by the version of Skills CLI you installed, then confirm it no
longer appears in `npx skills list -g --json`. Do not delete unrelated skills manually.
