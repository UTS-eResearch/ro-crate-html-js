/* This is part of Calcyte a tool for implementing the DataCrate data packaging
spec.  Copyright (C) 2018  University of Technology Sydney

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


const assert = require('assert');
const fs = require ('fs-extra');
const Preview = require('../lib/ro-crate-preview-wrapper');
const HtmlFile = require('../lib/ro-crate-preview-file');
const ROCrate = require('../lib/rocrate');


const chai = require('chai');
chai.use(require('chai-fs'));

describe('single item rendering', function () {
    it('should create a simple table', async function () {
      this.timeout(5000); 
      json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
      const crate = new ROCrate(json);
      const preview = new Preview(crate);
      const table = await preview.renderMetadataForItem(preview.rootId);
      assert.equal(table.find("tr").length, 16, "Has the right number of rows");
    });
});

describe('metadata summary', function () {
  this.timeout(5000); 

    it('should create multipe metadata tables', async function () {
      json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
      const preview = new Preview(new ROCrate(json));
      const div = await preview.summarizeDataset();
      assert.equal(div.find("table").length, 8, "Has the right number of summary tables");

    });
});

describe('actual file', function () {
  it('should create an html file', async function () {
    json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
    const preview = new Preview(new ROCrate(json));
    const f = new HtmlFile(preview);
    const html = await f.render();
    // Worst test ever
    assert.equal(html.search(/^\s+<html>/), 0);
  });
});

describe('datacite', function () {
  it('should create a datacite-compatible file', async function () {
    json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
    const preview = new Preview(new ROCrate(json));
    const cite = preview.makeDataCite();
    assert.equal(cite["@type"], "Dataset", "Has the right number of summary tables");
    assert.equal(cite.creator.name,"Peter Sefton", "Name is correctly nested")
    assert.equal(cite.publisher.contactPoint['@id'],"peter.sefton@uts.edu.au", "Name is correctly nested")

  });
});


describe('render a file', function () {
  it('should create a file', async function () {
    json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
    const preview = new Preview(new ROCrate(json));
    const f = new HtmlFile(preview);
    fs.writeFileSync("test.html", await f.render());
  });
});


describe('val.match bug with integer ContentSize', function () {
  it('should create a file from an ro-crate with an integer value', async function () {
    json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata-integer.jsonld"));
    const preview = new Preview(new ROCrate(json));
    const f = new HtmlFile(preview);
    fs.writeFileSync("test.html", await f.render());
  });
});



after(function () {

});

