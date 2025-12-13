# RustyVault UI

A professional web UI for RustyVault, built using the shared component library from health-v1 monorepo.

## Features

- **Professional Design**: Uses shared `@health-v1/ui-components` library
- **Modern Stack**: TanStack Router, React Query, Zustand
- **Type-Safe**: Full TypeScript support
- **Consistent**: Matches admin app design patterns

## Getting Started

### Prerequisites

- Bun (latest version)
- RustyVault server running on `http://127.0.0.1:8200`

### Installation

From the monorepo root:

```bash
cd cli
bun install
```

### Development

```bash
cd packages/apps/rustyvault-ui
bun run dev
```

The UI will be available at `http://localhost:3000`

### Building

```bash
bun run build
```

## Project Structure

```
src/
├── components/
│   └── navigation/
│       └── Sidebar.tsx      # Professional sidebar navigation
├── lib/
│   └── api/                 # API client and modules
│       ├── client.ts        # Axios-based API client
│       ├── secrets.ts       # Secrets API
│       ├── realms.ts        # Realms API
│       ├── auth.ts          # Authentication API
│       └── system.ts        # System operations API
├── routes/                  # TanStack Router file-based routes
│   ├── __root.tsx          # Root route with auth
│   ├── index.tsx           # Dashboard
│   ├── login.tsx           # Login page
│   ├── secrets.tsx          # Secrets management
│   ├── realms.tsx          # Realms management
│   └── system.tsx          # System operations
├── stores/
│   └── authStore.ts        # Zustand auth store
├── index.css               # Tailwind CSS
└── main.tsx                # Entry point
```

## Technology Stack

- **React 19** - UI framework
- **TanStack Router** - Type-safe routing
- **TanStack React Query** - Data fetching
- **Zustand** - State management
- **@health-v1/ui-components** - Shared component library
- **Tailwind CSS** - Styling
- **Biome.js** - Linting and formatting

## Next Steps

The basic structure is in place. To complete the migration:

1. **Implement Secrets Page**: Use Table, Dialog, and Card components from shared library
2. **Implement Realms Page**: Match admin app's user/organization pages
3. **Implement System Page**: Use Card components for seal status, mounts, etc.
4. **Add Error Boundaries**: For better error handling
5. **Add Loading States**: Use shared components for consistent loading UI

## Migration from Old UI

The old UI in `RustyVault/ui/` can be removed once this migration is complete. All functionality has been migrated to use:

- Shared components instead of custom components
- TanStack Router instead of React Router
- Professional design patterns from admin app
- Consistent styling with Tailwind

