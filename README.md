# Upload to Release GitHub Action

A GitHub Action that uploads a file to a new release.

## Getting Started

```yml
jobs:
  build:
    # ...
    steps:
      - uses: lucyio/upload-to-release
        with:
            # repo username/name
            name: lucyio/electron
            # directory of all your files you want to upload (not recursive only flat, directories are skipped)
            path: ./electron_dist
            # can be enum of published, unpublished, created, prereleased
            action: unpublished
            # release tag
            release_id: 0.5.8
            # release repository name
            release-repo: lucyio/electron
            # secret for your github token to use
            repo-token: ${{ secrets.github_token_release }}
```

## How it works (briefly)

- pulls a list of your releases last 10 (drafts or not) and scans by tag (release_id)
- if it matches it'll use that and upload assets (does not delete anything)
- if it does not match, it'll create a new release and upload assets there
- during uploads it will upload everything inside the `path` directory

## Shoulders

This was inspired by:

- https://github.com/actions/javascript-template
- https://github.com/JasonEtco/upload-to-release
- https://github.com/Shopify/upload-to-release

