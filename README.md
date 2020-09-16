# ro-crate : Research Object Crate HTML preview generation

This nodejs repository has code for generating HTML previews for Research Object Crate ([RO-Crate]https://researchobject.github.io/ro-crate/())

## Install

Download this repository:

```
git clone https://github.com/UTS-eResearch/ro-crate-html-js
cd ro-crate-htmljs
```

Install it and link the commandline commands:

```
npm install .
npm link --local

```
## Commandline HTML rendering

### Dynamic, generic HTML for ANY crate

To render HTML for an RO-Crate, use makehtml, with a URL to the compilef ro-crate.js rendering script (See below for how to compile). Eg:

```makehtml  test_data/sample-ro-crate-metadata.jsonld  -c https://data.research.uts.edu.au/examples/ro-crate/examples/src/crate.js```


To compile the rendering script for an RO-Crate HTML file (ro-crate-preview.html):

```browserify lib/entry.js -o lib/crate.js```

### Make crates that contain other crates w/ an HTML page

To make a crate that 'wraps' a series of crates in sub directories:

```
metacrate  -d directory_with_crates_in -n "Sample RO-Crates" -t "This RO-Crate links to other crates"
```


### Create a static site

To create a RO-Crate static HTML website for a crate, use `rocsatic` - this requires some fairly complicated configuration which is not yet documented, but you can look at an example in the Heurist2ro-crate project: https://github.com/UTS-eResearch/heurist2ro-crate 

See the `MAKEFILE`  for a commands that reference an configuration file.

TODO: Explain this properly.


### Generate an HTML or Markdown vocab file from a a crate

For crates that have Class or Property definitions you can generate an HTML fragment that can be published on the web.

```rocschema <path-to-crate>```

Will create a markdown file that serves are rudimentary documentation. Add --html for HTML.

TODO: Add examples.











