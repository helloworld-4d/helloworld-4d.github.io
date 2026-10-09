# Video hosting

All 48 report videos are served from https://helloworld-4d.github.io/helloworld-media-1/ and https://helloworld-4d.github.io/helloworld-media-2/. Each site is under 640 MB. No additional compression or resizing was performed.

The two matching GitHub repositories contain manifests and an Actions workflow. Builds download the existing release assets and verify every file against its byte count and SHA256 before deploying. Keep the source releases; visitors no longer download from Releases.

`media-pages.js` resolves dynamic legacy clip URLs to Pages. Initial HTML sources, LiDAR manifests, and `media-manifest.json` use Pages directly. To add a clip, add its verified metadata to a media repository, deploy, and update the mapping and section configuration. Retain explicit video/mp4 source types.

Rollback: revert the website migration commit; source releases are still available. Diagnostic test pages remain separate from the homepage pending mobile confirmation.
