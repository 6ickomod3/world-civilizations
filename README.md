# World Civilizations Atlas

An interactive single-page atlas for comparing major world civilizations through time and geography. Explore regional timeline lanes, select a civilization to see its geographic core, and compare cultures that overlapped in time.

Dates are approximate and represent selected historical periods. Map markers indicate geographic cores rather than historical borders. The atlas is a starting selection, not an exhaustive list of world civilizations; individual entries link to sources for further reading.

## Website

The proposed repository is `6ickomod3/world-civilizations`. Once the repository is created and GitHub Pages finishes its first deployment, its expected address is:

[https://6ickomod3.github.io/world-civilizations/](https://6ickomod3.github.io/world-civilizations/)

This is a static website: all page content, styles, and interactions are in `index.html`.

## Publish with GitHub Pages

1. Push these files to the `main` branch of the selected GitHub repository.
2. Open the repository's **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages** and run the workflow if the initial push occurred before Pages was enabled.
4. Wait for the deployment to succeed; GitHub shows the published URL in the workflow's `github-pages` environment and in the Pages settings.

The included workflow copies only `index.html` and `.nojekyll` into the published artifact. It uses GitHub's official Pages actions and requires no extra credentials or package installation.

## Update the atlas

Edit `index.html`, commit the change, and push it to `main`. The workflow automatically publishes the updated page. If you change the repository name or use a different account, update the expected address above.

To preview locally, open `index.html` in your browser, or run a local static server from the repository directory:

```sh
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Hosting references

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Configure the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Use GitHub's official Pages workflow actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
