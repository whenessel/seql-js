# Development Setup

Setting up seql-js for local development.

## Prerequisites

- Node.js v18+
- Yarn v1.22+

## Clone & Install

```bash
git clone https://github.com/whenessel/seql-js.git
cd seql-js
yarn install
```

## Development Commands

```bash
# Build library
yarn build

# Watch mode
yarn build:watch

# Run tests
yarn test

# Watch tests
yarn test:watch

# Type checking
yarn types:check

# Coverage
yarn test:coverage
```

## Project Structure

```
seql-js/
├── src/                 # Source code
│   ├── generator/      # EID generation
│   ├── resolver/       # EID resolution
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── tests/              # Test files
├── docs/               # Documentation
├── dist/               # Build output
└── package.json
```

## Making Changes

1. Create feature branch
2. Make changes in `src/`
3. Add/update tests in `tests/`
4. Run `yarn test`
5. Run `yarn build`
6. Commit with descriptive message
