# HelloWorld project page

GitHub Pages serves the website, figures, and losslessly compressed point-cloud chunks. Videos are hosted in this repository's GitHub Releases: `media-20260923`, with updated Layout Editing demos in `layout-20260925`. No development-server dependency remains.

Video candidates preserve source resolution, frame rate and duration. Selected encodes use H.264 CRF 18 / preset slow; already compact operation demos retain their original bytes. Point-cloud chunks use reversible 16-byte-record byte shuffling followed by gzip, decoded progressively in the browser without dropping or quantizing points.

Edit this published snapshot carefully: its media loader differs from the development server's script-based loader. Do not overwrite it with an older development snapshot.
