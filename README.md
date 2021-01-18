# ro-crate : Research Object Crate HTML preview generation

This nodejs repository has code for generating HTML previews for Research Object Crates ([RO-Crate](https://researchobject.github.io/ro-crate/))

RO-Crates are data packages consisting of a folder/directory of content with a JSON-LD manifest  known as an *RO-Crate Metadata File*, which has the filename `ro-crate-metadata.json` in the root folder. RO-Crates also should have an *RO-Crate Website* which is a local set of web resources, with an index page `ro-crate-preview.html`.

This library consists of tools to create an *RO-Crate Website* for a crate, from the *RO-Crate Metadata File*.

There are two approaches to this:

- `rochtml` is a script that creates an HTML page that summarises the RO-Crate root dataset (which is always a Schema.org Dataset object expressed in JSONLD) and then dynamically renders details about other entities, both Data Entities (files, datasets and otehr local and remote streams of data) and Contextual Entities (addition information about data provenance such how files were created, by whom and where) described in the crate. This script creates a single, small HTML file.

- `rocstatic` is a script that creates a multi page RO-Crate Website* using some confguration.

In most cases `rochtml` is the most appropriate tool unless the crate you are dealing with is very large (more than 5000 entities) or is largely made up of contextual entities such as historical events, people etc.


## Install

To install this from npm type:

npm install ro-crate-html-js

## Develop

To make changes to this code:

-  Download this repository:

  ```
  git clone https://github.com/UTS-eResearch/ro-crate-html-js
  cd ro-crate-htmljs
  ```

-  Install it and link the commandline commands:

  ```
  npm install .
  npm link --local
  ```


## Commandline HTML rendering

### Dynamic, generic HTML for ANY crate

To render HTML for an RO-Crate, use rochtml:

```rochtml  test_data/sample-ro-crate-metadata.jsonld```


To compile the rendering script for an RO-Crate HTML file (ro-crate-preview.html):

```browserify lib/entry.js -o dist/ro-crate-dynamic.js```

### Make crates that contain other crates w/ an HTML page

To make a crate that 'wraps' a series of crates that are in sub directories into a container crate:

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











