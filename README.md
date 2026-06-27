# Zync Log Web Client

A high-performance, modern, and beautiful web interface for viewing and searching local application logs. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Real-time Streaming**: Seamlessly stream incoming logs using Server-Sent Events (SSE).
- **Advanced Filtering**: Filter logs by levels (Debug, Info, Warning, Error, Fatal), date ranges, and custom queries.
- **High Performance**: Renders hundreds of thousands of log entries smoothly using virtual list scrolling (`react-virtuoso`).
- **Interactive Details**: Expand log rows to view full structured payloads and metadata details.
- **Aesthetic UI**: A premium dark-themed interface built with Tailwind CSS, custom loaders, and smooth micro-animations powered by Framer Motion.

## Technical Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Development

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build the production assets:
```bash
npm run build
```
This compiles TypeScript files and builds the optimized frontend bundle into the `dist/` directory, ready to be served by the `zync-api` backend.
