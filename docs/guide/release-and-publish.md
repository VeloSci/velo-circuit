# Release and Publish

This project publishes to npm using GitHub Actions when a semantic tag is pushed.

## Requirements

- GitHub secret: `NPM_TOKEN`
- npm access token with publish permission over `velo-circuit`
- Node 22+ locally (Node 22/24 are validated in CI)

## CI and Publish Flows

- `CI` workflow runs on pull requests and pushes to `main`
- `Publish to npm` workflow runs on tags matching `v*`
- `Deploy docs` workflow publishes the VitePress site to GitHub Pages on pushes to `main`

Both CI and publish workflows run:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

## Release sequence (0.4.0 → 1.0.0)

**v0.4.0** — If `package.json` is already at `0.4.0`, tag manually (the release script cannot bump to the same version):

```bash
git tag v0.4.0
git push origin v0.4.0
```

**v1.0.0** — Use the automated script:

```bash
pnpm release:prepare -- 1.0.0
```

This command:

- validates typecheck/tests/build
- updates `package.json` and `package-lock.json` to `1.0.0`
- creates commit `chore(release): v1.0.0`
- creates tag `v1.0.0`
- pushes branch and tag to GitHub

If you need to test the script without pushing:

```bash
pnpm release:prepare -- 1.0.0 --no-push
```

## Documentation site

Build locally:

```bash
pnpm docs:dev      # development server
pnpm docs:build    # production build
pnpm docs:preview  # preview production build
```

Live site: [jigonzalez930209.github.io/velo-circuit](https://jigonzalez930209.github.io/velo-circuit/)
