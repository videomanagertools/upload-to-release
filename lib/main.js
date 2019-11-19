const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const mime = require('mime');

async function run() {
  try {
    const releaseAction = core.getInput('action', { required: true });
    const release_id = process.env.APP_VERSION_NUMBER || core.getInput('release_id', { required: false });
    const release_name = process.env.GITHUB_SHA || 'Automated Github Action Release';
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
    // https://octokit.github.io/rest.js/
    const name = core.getInput('name', { required: true });
    const path = core.getInput('path', { required: true });

    console.log(`Uploading ${path} to ${name} on release ${release_id} to ${owner}/${repo}`);

    const releases = await octokit.repos.listReleases({
        owner,
        repo,
        per_page: 10
    })
    console.log(`release object`, releases)
    const existingRelease = releases.data.filter((er) => er.tag_name == release_id) 
    console.log(`existingRelease object`, existingRelease)


    var url = ''
    if (existingRelease.length == 0) {
        var { data: { upload_url: url } } = await octokit.repos.createRelease({
            owner,
            repo,
            tag_name: release_id,
            name: release_name,
            draft: true})
        console.log(`Upload URL: ${url}`)
    } else {
        const eRelease = await octokit.repos.getRelease({owner, repo, release_id: existingRelease[0].id})
        var url = existingRelease[0]['upload_url']
        console.log(`existingRelease: ${eRelease}`)
        console.log(`existingRelease: ${url}`)
    }


    fs.readdir(path, async function(err, items) {
        for (var i=0; i<items.length; i++) {

            try {
                const file_name = items[i]
                const file_path = path + '/' + file_name
                console.log('file_path', file_path)

                // check if it's a file
                if (fs.statSync(file_path).isFile()) {
                    const file = fs.createReadStream(file_path)
                    const headers = {
                        'content-type': mime.getType(file_path),
                        'content-length': fs.statSync(file_path).size,
                    }

                    if (headers['content-type'] == null) {
                        headers['content-type'] = 'application/octet-stream'
                    }

                    const { data: { browser_download_url: browser_download_url }} = await octokit.repos.uploadReleaseAsset({
                        url: url,
                        headers,
                        name: file_name,
                        file})
                    console.log(`Download URL: ${browser_download_url}`)
                }

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
