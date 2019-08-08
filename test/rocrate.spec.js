/* This is part of rocrate-js a node library for implementing the RO-Crate data
packaging spec. Copyright (C) 2019 University of Technology Sydney

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

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const expect = require("chai").expect;
const ROCrate = require("../lib/rocrate");
const jsonUtils = require("../lib/utils");
const defaults = require("../lib/defaults");


function newCrate(graph) {
	return new ROCrate({ '@context': defaults.context, '@graph': graph});
}


describe("JSON-LD helper simple tests", function () {
  var test_path;
  const utils = new jsonUtils();
  it("Test basic setup", function (done) {
    const crate = new ROCrate();
    assert(utils.hasType(crate.rootDataset, "Dataset"));
    assert.equal(crate.json_ld["@context"] , "https://raw.githubusercontent.com/ResearchObject/ro-crate/master/docs/0.2-DRAFT/context.json", "Has standard context (defined in ./lib/defaults.js)")
    done();
  });
});

describe("Basic graph item operations", function() {

	it("Can fetch items by id", function () {

		const graph = [
	  	 	{ '@id': 'https://foo/bar/oid1', 'name': 'oid1', 'description': 'Test item 1' },
	  		{ '@id': 'https://foo/bar/oid2', 'name': 'oid2', 'description': 'Test item 2' }
		];

		const crate = newCrate(graph);
		crate.index();

		const item = crate.getItem('https://foo/bar/oid1');
		expect(item).to.have.property('@id', 'https://foo/bar/oid1');

	});

});


