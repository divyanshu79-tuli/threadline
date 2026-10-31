# Threadline

Threadline is an open source, local-first desktop app that turns meeting transcripts into reviewed decisions and trackable work. Meeting memory stays in the app until a person explicitly approves a task for posting.

## Run

Requires Node.js 20+.

```sh
npm install
npm start
```

## Current prototype

- Paste a transcript and extract speaker-attributed decisions and action items.
- Keep a searchable cross-meeting decision memory and flag opposing decisions.
- Edit and approve draft actions before they enter the local task queue.
- View deadline reminders and weekly per-person digest previews.
- Configure an HTTPS task webhook; approved items are posted as JSON only after confirmation.
- Schedule desktop notifications one day before approved task deadlines while the app is running.
- Data is stored in Electron's local browser storage on this computer.

## Roadmap

Connect a task tracker or automation service that accepts a JSON webhook. The endpoint is stored with Electron's protected storage when available. Reminder timers run while Threadline is open; OS-level scheduling after the app exits and recurring digest delivery are future work. Do not connect an untrusted webhook: approving an item sends its text, owner, due date, and meeting title to that endpoint.

## License

MIT. See [LICENSE](LICENSE).
