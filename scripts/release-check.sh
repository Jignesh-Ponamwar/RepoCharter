#!/usr/bin/env bash
set -euo pipefail

# Local preview check only. This script does not publish, authenticate to npm, or claim
# macOS/Linux results. Run it in each clean target environment and record observations.
node --version
npm --version
npm run lint
npm test
npm pack --dry-run --json
