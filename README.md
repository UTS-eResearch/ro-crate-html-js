# ro-crate : Research Object Crate HTML preview generation

This repository has code for generating HTML previews for Research Object Crate ([RO-Crate]https://researchobject.github.io/ro-crate/())


## Commandline HTML rendering

### Dynamic, generic HTML for ANY crate

To render HTML for an RO-Crate, use makehtml, with a URL to the compilef ro-crate.js rendering script (See below for how to compile). Eg:

```makehtml  test_data/sample-ro-crate-metadata.jsonld  -c https://data.research.uts.edu.au/examples/ro-crate/examples/src/crate.js```


To compile the rendering script for an RO-Crate HTML file (ro-crate-preview.html):

```browserify lib/entry.js -o lib/crate.js```


### Create a static site

TODO - coming soon






