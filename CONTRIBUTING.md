# Contributing to LiniusNv

Thanks for your interest in contributing! LiniusNv is a fork of
[Baileys](https://github.com/WhiskeySockets/Baileys); contributions here follow
similar conventions to the upstream project.

## Reporting issues

- Search existing issues before opening a new one.
- Include: Node.js version, `@LiniusNv-Bail/Bails` version, a minimal reproduction,
  and the relevant log output (with sensitive data like phone numbers redacted).

## Submitting changes

1. Fork the repository and create a branch from `main`.
2. Keep changes focused — one fix or feature per pull request.
3. Follow the existing code style (ESLint config is included: `npm run lint`).
4. Add or update tests where relevant (`npm test`).
5. Write a clear commit message describing what changed and why.
6. Open a pull request describing the change and linking any related issue.

## Development setup

```bash
git clone https://github.com/LiniusNv-Bail/Bails.git
cd baileys
npm install
npm run build:tsc
npm test
```

## Code of conduct

Be respectful and constructive. Disagreements about implementation are fine;
personal attacks are not. Issues or PRs that violate this will be closed.

## License

By contributing, you agree that your contributions will be licensed under the
project's [MIT License](LICENSE).
