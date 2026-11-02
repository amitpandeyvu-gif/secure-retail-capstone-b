# Contributing

Use a short feature branch and keep each commit focused on one logical change.
Before opening or updating a pull request, run:

```powershell
npm ci
npm run db:init
npm test
```

Do not commit `.env` files, database files, API keys, passwords or real customer
information. Describe the change, test evidence and any database impact in the pull
request. Resolve review comments with a new commit so the history remains visible.
