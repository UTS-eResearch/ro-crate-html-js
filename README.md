# ro-crate : Research Object Crate (RO-Crate) utilities 

This is an early version ALPHA quality library to support Research Object Crate ([RO-Crate]https://researchobject.github.io/ro-crate/())


## HTML Rendering

To render HTML for an RO-Crate, use makehtml, with a URL to the ro-crate.js rendering script. Eg:

```makehtml  test_data/sample-ro-crate-metadata.jsonld  -c https://data.research.uts.edu.au/examples/ro-crate/examples/src/crate.js```



## Regenerating crate.js

To create the rendering script for an RO-Crate HTML file (ro-crate-preview.html):

```browserify lib/entry.js -o lib/crate.js```

(We will put a copy of this on the RO-Crate site when the spec is released in version 1 and make it the default).







