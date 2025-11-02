Publishing the Taiwan Air Quality Dashboard

This document shows quick ways to publish this static site so others can open a link and view it.

1) Quick: GitHub Pages (recommended, free)
- Create a GitHub repository (UI or github.com/new).
- On your local machine run (PowerShell):

  cd 'C:\Users\Anastasiia\Downloads\startbootstrap-sb-admin-2-gh-pages'
  git init
  git add .
  git commit -m "Initial site"
  git branch -M main
  # Create a repository on GitHub and copy its SSH/HTTPS URL, then:
  git remote add origin <https://github.com/picooo1/taiwan-dashboard.git

- In the GitHub repository: Settings → Pages (or Settings → Pages & branches). Choose source: "main" branch (root) or "gh-pages" branch. Save.
- After a minute GitHub will provide a public URL (https://<your-username>.github.io/<repo>/) where your site will be served.

Notes:
- If you prefer the repo to serve from the `docs/` folder, move site files into `docs/` and set Pages source to `main / docs`.
- If you want automatic deploys from a branch that contains build artifacts, see the GitHub Actions approach (advanced).

2) Quick: Netlify (drag & drop or git)
- Drag & drop: zip the site folder and drop it on https://app.netlify.com/drop for instant hosting.
- Git-based: connect your GitHub repo to Netlify and choose the branch; Netlify auto-deploys.
- Netlify gives you a public URL and supports custom domains.

3) Quick: Vercel
- Similar to Netlify: connect your GitHub repo at https://vercel.com/new and deploy. Vercel auto-detects static sites and provides a public URL.

4) Expose locally for testing on LAN (not public)
- Run a server binding to all interfaces:

  cd 'C:\Users\Anastasiia\Downloads\startbootstrap-sb-admin-2-gh-pages'
  python -m http.server 8000 --bind 0.0.0.0

- Find your local IP (PowerShell):
  ipconfig
  # Use the IPv4 address

- From another device on the same network open:
  http://<YOUR_HOST_IP>:8000/taiwan-dashboard.html

Security note: binding to 0.0.0.0 exposes your machine to other devices on the LAN; do this only on trusted networks.

5) Helpful tips
- If you don't have git installed: https://git-scm.com/downloads
- To push via HTTPS you may need to sign into GitHub or use a personal access token if using 2FA.

If you want, I can:
- Create a Git repo locally and commit files (I can run these commands here). You will still need to create the remote GitHub repo and run the `git remote add`/`git push` commands with your credentials.
- Generate a GitHub Actions workflow to publish to GitHub Pages automatically (requires pushing the workflow to GitHub).
- Walk you step-by-step through the GitHub Pages setup and do the local git side here.

Tell me which option you want and I will either run local git commands to prepare commits or give exact next commands for you to run.