# LosslessCut Backend

This is the backend service for LosslessCut, built with Express, Prisma (SQLite), and TypeScript.

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Generate Prisma Client:
   ```bash
   yarn workspace lossless-cut-backend prisma generate
   ```

3. Run migrations:
   ```bash
   yarn workspace lossless-cut-backend prisma migrate dev
   ```

4. Start development server:
   ```bash
   yarn workspace lossless-cut-backend dev
   ```
   Or use the VS Code Task: "Run Backend (Dev)".

## Structure

- `src/index.ts`: Entry point.
- `prisma/schema.prisma`: Database schema.
- `.env`: Environment variables (contains `DATABASE_URL`).
