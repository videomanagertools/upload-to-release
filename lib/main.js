const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const mime = require('mime');

async function run() {
  try {
    const releaseAction = core.getInput('action', { required: true });
    const release_id = core.getInput('release_id', { required: true });
    // https://developer.github.com/v3/activity/events/types/#releaseevent
    switch (releaseAction) {
        case "published":
        case "created":
        case "unpublished":
        case "prereleased":
            break
        default:
            console.log(`Skipping release: ${releaseAction}`)
            return
    }

    const [owner, repo] = core.getInput('release-repo', { required: true }).split('/')

    const token = core.getInput('repo-token', { required: true });
    const octokit = new github.GitHub(token);

    const name = core.getInput('name', { required: true });
    const path = core.getInput('path', { required: true });

    console.log(`Uploading ${path} to ${name} on release ${release_id} to ${owner}/${repo}`);

    // const { data: { upload_url: url } } = await octokit.repos.getRelease({owner, repo, release_id})
    // console.log(`Upload URL: ${url}`)
    // const release = await octokit.repos.listReleases({
    //     owner,
    //     repo
    // })
    // console.log(`release object`, release)

    const { data: { upload_url: url } } = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name: release_id,
        draft: true})
    console.log(`Upload URL: ${url}`)

    // const { data: assets } = await octokit.repos.listAssetsForRelease({owner, repo, release_id})
    // assets.forEach(({ id: asset_id, name: asset_name }) => {
    //     if (asset_name == name) {
    //         octokit.repos.deleteReleaseAsset({owner, repo, asset_id})
    //     }
    // })

    fs.readdir(path, async function(err, items) {
        for (var i=0; i<items.length; i++) {

            try {
                const file_name = items[i]
                const file_path = path + '/' + file_name
                console.log('file_path', file_path)
                const file = fs.createReadStream(file_path)
                const headers = {
                    'content-type': mime.getType(file_path),
                    'content-length': fs.statSync(file_path).size,
                }

                const { data: { browser_download_url: browser_download_url }} = await octokit.repos.uploadReleaseAsset({url: url, headers, name: file_name, file})
                console.log(`Download URL: ${browser_download_url}`)
            } catch (error) {
              core.setFailed(error.message);
            }
        }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
