# Project grill

Work the decision tree in rounds. The frontier is every applicable unresolved decision
whose dependencies are settled. Ask the entire frontier before waiting; do not include
a question that depends on another question in the same round.

Format each question as:

```text
❓ **Q1** - **Title**: decision and relevant choices

➡️ recommended answer
```

Challenge vague success criteria, conflicting MVP/exclusion decisions, unsupported
completion claims, and future scope that changes present architecture. Summarize every
settled decision and remaining unknown. Do not create a specification until the
developer explicitly confirms that summary.
