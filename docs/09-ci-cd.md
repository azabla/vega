# CI/CD with GitHub Actions

One workflow, [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):

| Job | Runs on | What it checks |
|---|---|---|
| **Backend tests** | every push and PR | `manage.py check`, models and migrations in sync (`makemigrations --check`), `test portfolio accounts` against Postgres 17 (same as production) |
| **Frontend lint & build** | every push and PR | `eslint src`, `vite build` on Node 22 |
| **Production images build** | every push and PR | both Dockerfiles still build (`backend`, `frontend` target `prod`) |
| **Deploy to VPS** | pushes to `main`, only if all three pass | SSHes to the server and runs `deploy/deploy.sh <sha>` |

The deploy uses the exact commit that passed CI (`deploy.sh` fast-forwards to it), runs one at a time, and is never
cancelled halfway. A failed health check fails the job, so a broken release shows up red on GitHub.

You can still deploy by hand on the server: `cd /opt/vega && ./deploy/deploy.sh`.

## One-time setup

### 1. A deploy key for GitHub Actions → server

**(local)** — a separate key used only by CI:

```bash
ssh-keygen -t ed25519 -C "vega-ci" -f ~/.ssh/vega_ci -N ""
```

On the server, add the public key to the deploy user's `~/.ssh/authorized_keys`, restricted so it can only run the
deploy script. CI sends `/opt/vega/deploy/deploy.sh <sha>`; the forced command passes on only the last word, and
`deploy.sh` rejects anything that isn't a commit SHA:

```
command="/opt/vega/deploy/deploy.sh ${SSH_ORIGINAL_COMMAND##* }",restrict ssh-ed25519 AAAA... vega-ci
```

The deploy user must be in the `docker` group and able to `git fetch` (the read-only repo deploy key from
[07](07-deployment-vps.md)).

Get the server's host key so CI can verify it **(local)**:

```bash
ssh-keyscan -p 22 YOUR_SERVER_IP
```

### 2. GitHub settings

**azabla/vega → Settings → Environments → New environment `production`.** Add these as environment secrets:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | server IP or hostname |
| `DEPLOY_USER` | the user that owns `/opt/vega` |
| `DEPLOY_SSH_KEY` | contents of `~/.ssh/vega_ci` (the **private** key) |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan` above |
| `DEPLOY_PORT` | optional, default `22` |

Optional environment variables: `DEPLOY_PATH` (default `/opt/vega`) and `SITE_URL` (shown as a link on the run).

Optional, recommended:

- **Environment → Required reviewers**: each deploy waits for your click.
- **Branches → branch protection on `main`**: require the *Backend tests*, *Frontend lint & build* and
  *Production images build* checks before merging a PR.

## When CI fails

- **Models and migrations are in sync** — a model changed without a migration, or a migration was committed without
  its model change. Run `venv/bin/python manage.py makemigrations` locally and commit the result together with the model.
- **Deploy to VPS** — the job log shows `deploy.sh` output. On the server: `vega logs --tail=80 backend`. Roll back as
  in [07 → Rolling back](07-deployment-vps.md#updating-the-site).
