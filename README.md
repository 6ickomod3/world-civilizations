# World Civilizations Atlas

An interactive single-page atlas for comparing major world civilizations through time and geography. Explore regional timeline lanes, select a civilization to see its geographic core, and compare cultures that overlapped in time.

Dates are approximate and represent selected historical periods. Highlighted modern countries locate geographic cores rather than historical borders. The atlas is a starting selection, not an exhaustive list of world civilizations; individual entries link to sources for further reading.

## Website

The repository is [6ickomod3/world-civilizations](https://github.com/6ickomod3/world-civilizations). GitHub Pages publishes the atlas at:

[https://6ickomod3.github.io/world-civilizations/](https://6ickomod3.github.io/world-civilizations/)

The world atlas is in `index.html`. The Europe architecture passport is a second static page at:

[https://6ickomod3.github.io/world-civilizations/europe/](https://6ickomod3.github.io/world-civilizations/europe/)

The Europe page connects 32 buildings across 19 countries to a map, construction dates, architecture families, and overlapping historical contexts. Its personal scorecard tracks planned and visited places, visit dates, optional impressions, notes, and coverage by country and historical period. Personal records stay in the browser and can be downloaded and restored as a JSON file; they are not stored in the repository or sent to a server.

Europe source files are in `europe/`. The datasets link to monument operators, heritage organizations, museums and academic sources. Photos are locally hosted; each selected building displays its Wikimedia Commons attribution and license, also recorded in `europe/photos.json`. Geographic points can be approximate. Modern country outlines are orientation references rather than historical borders.

## Publish with GitHub Pages

1. Push these files to the `main` branch of the selected GitHub repository.
2. Open the repository's **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages** and run the workflow if the initial push occurred before Pages was enabled.
4. Wait for the deployment to succeed; GitHub shows the published URL in the workflow's `github-pages` environment and in the Pages settings.

The included workflow copies `index.html`, `.nojekyll`, and the `europe/` directory into the published artifact. It uses GitHub's official Pages actions and requires no extra credentials or package installation.

## Update the atlas

Edit the relevant page or dataset, commit the change, and push it to `main`. The workflow automatically publishes the updated pages. If you change the repository name or use a different account, update the addresses above.

To preview locally, open `index.html` in your browser, or run a local static server from the repository directory:

```sh
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Hosting references

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Configure the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Use GitHub's official Pages workflow actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
