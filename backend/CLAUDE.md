# Deployment

Backend is deployed on Railway, connected to this GitHub repo — pushing to `main`
triggers an automatic Railway deploy (no manual/CLI trigger needed).

Frontend is deployed on Netlify (see `netlify.toml` at repo root, `base = frontend`) —
same auto-deploy-on-push behavior.
