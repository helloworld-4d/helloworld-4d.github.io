# Video hosting

All 48 report videos are served from https://helloworld-4d.github.io/helloworld-media-1/ and https://helloworld-4d.github.io/helloworld-media-2/. Each site is under 640 MB. No additional compression or resizing was performed.

The two matching GitHub repositories contain manifests and an Actions workflow. Builds download the existing release assets and verify every file against its byte count and SHA256 before deploying. Keep the source releases; visitors no longer download from Releases.

`media-pages.js` resolves dynamic legacy clip URLs to Pages. Initial HTML sources, LiDAR manifests, and `media-manifest.json` use Pages directly. To add a clip, add its verified metadata to a media repository, deploy, and update the mapping and section configuration. Retain explicit video/mp4 source types.

Rollback: revert the website migration commit; source releases are still available. Diagnostic test pages remain separate from the homepage pending mobile confirmation.

## Mobile compatibility

The two closed-loop clips and eight distillation clips have additional H.264 High Level 4.1 copies under mobile-videos/. Closed-loop copies are 1558x1080 and distillation copies are 1438x1080. They use CRF 18, yuv420p, faststart, and retain every frame, frame rate and duration. mobile-video-manifest.json records dimensions and hashes. video-source.js selects these for iPhone, iPad and Android; desktops continue using the original Pages streams. Other sections are unchanged. The distillation player requests playback even before preloading completes and does not cancel its own initial buffering.
