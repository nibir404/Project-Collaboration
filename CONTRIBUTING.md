# Contributing to GitHub Activity Tracker

Thank you for considering contributing! This document outlines the process for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`

## Development Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push

# Start dev server
npm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow existing ESLint configuration
- Run `npm run lint` before committing

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Test coverage
- `chore:` Maintenance

## Pull Request Process

1. Update documentation for any changes
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the CHANGELOG.md
5. Submit a pull request

## Reporting Bugs

Open an issue with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Feature Requests

Open an issue with:
- Clear description
- Use cases
- Alternative solutions considered

---

## Questions?

Open an issue for questions about contributing.