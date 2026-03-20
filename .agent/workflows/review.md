---
description: Code Review
---

# Code Review Workflow
This workflow audits changes and posts the result to GitHub.

## Steps
1. **Analyze Diff**: Run `git diff` to analyze staged or recent changes.
2. **Logic Check**: Review for security (leaked tokens), logic errors, and React/Node best practices.
3. **UI Verification**:
   - Use the `playwright` MCP (Brave) to visit `localhost:3000`.
   - Take a screenshot to confirm the layout is intact.
4. **Report Generation**: Summarize findings in a local report (Passed/Warnings/Blockers).
5. **GitHub Integration**: 
   - Use `github-custom` to find the current repository.
   - If a Pull Request exists for this branch, post the "Report Generation" summary as a **PR Comment**.
   - If no PR exists, offer to create one with the review attached.

## Shortcut
- /review : Executes the full audit and syncs with GitHub.