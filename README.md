# World Civilizations Atlas

An interactive single-page atlas for comparing major world civilizations through time and geography. Explore regional timeline lanes, select a civilization to see its geographic core, and compare cultures that overlapped in time.

Dates are approximate and represent selected historical periods. Highlighted modern countries locate geographic cores rather than historical borders. The atlas is a starting selection, not an exhaustive list of world civilizations; individual entries link to sources for further reading.

## Website

The repository is [6ickomod3/world-civilizations](https://github.com/6ickomod3/world-civilizations). GitHub Pages publishes the atlas at:

[https://6ickomod3.github.io/world-civilizations/](https://6ickomod3.github.io/world-civilizations/)

The world atlas is in `index.html`. The Europe story atlas is a second static page at:

[https://6ickomod3.github.io/world-civilizations/europe/](https://6ickomod3.github.io/world-civilizations/europe/)

The Europe page presents the guide’s complete 15 regional journeys and 354 candidate places through 45 linked story scenes, maps, historical time layers, and a searchable inventory. It also preserves 112 cross-journey connections, 13 coverage extensions and the guide’s alternative route choices. A personal passport tracks kept and visited places, dates, impressions and notes. Records remain in the browser and can be downloaded/restored; the redesigned atlas migrates the previous 32-landmark passport and accepts its backups.

The **English / 中文** switch displays the complete Europe atlas in English or Simplified Chinese, including stories, all 354 candidates, route notes, connections, map labels, timeline contexts and controls. The language choice is remembered separately from the passport and can be linked with `?lang=zh` or `?lang=en`. Search accepts English and Chinese names in either mode. `locales/zh-content-*.json` contains reviewed translations of the guide; place IDs, source links, numeric dates, category values and personal notes remain stable between languages. `i18n.js` translates interface copy and formats Chinese BCE/CE labels.

Europe source files are in `europe/`. `journeys-source.json` and `places-source.json` reproduce the public reference content from the source workbook while preserving its original IDs and 615 place source links. `journey-stories.json` adapts all 15 PDF chapters with verified page references. `place-enrichment.json` labels each map point as a site, city or regional reference, and distinguishes verified construction from contextual periods, mixed collections and landscapes. Modern country outlines provide orientation; map lines show conceptual learning connections. All 15 journey photographs and the existing landmark images have credits and license links.

## Publish with GitHub Pages

1. Push these files to the `main` branch of the selected GitHub repository.
2. Open the repository's **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages** and run the workflow if the initial push occurred before Pages was enabled.
4. Wait for the deployment to succeed; GitHub shows the published URL in the workflow's `github-pages` environment and in the Pages settings.

The included workflow publishes the root page and only Europe HTML, CSS, JavaScript, JSON and image assets. The source PDF/Excel files remain local, are Git-ignored and are excluded from deployment. Private editable workbook decisions and personal notes are omitted from the public guide data. It uses GitHub's official Pages actions and requires no extra credentials or package installation.

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

## Guide conversion and verification

With the source workbook available locally in `europe/`, run `python3 scripts/convert-trip-guide.py --check` to verify deterministic extraction of all 15 journeys, 354 places, 112 connections and 13 gaps. Run without `--check` to regenerate the two workbook-derived JSON files. PDF story changes and any geographical or temporal enrichment require review against the source.

`node scripts/test-guide-core.mjs` checks complete references, original passport migration, backup formats, safe records, filters and BCE/CE boundaries. `node scripts/test-guide-app.mjs` verifies the actual app’s storage initialization, notes-only backup controls, cross-chapter search and empty selection behavior.

`node scripts/test-language.mjs` verifies complete Chinese content coverage, supported language preferences, canonical IDs and Chinese time labels. The app checks also cover switching languages without changing saved records or selected filters, and searching both Chinese and English names.
