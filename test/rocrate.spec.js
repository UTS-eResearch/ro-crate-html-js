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
const _ = require('lodash');
const expect = require("chai").expect;
const ROCrate = require("../lib/rocrate");
const jsonUtils = require("../lib/utils");
const defaults = require("../lib/defaults");
const uuid = require('uuid').v4;

function newCrate(graph) {
	if (!graph) {graph = []};
	graph.push(defaults.metadataFileDescriptorTemplate);
	return new ROCrate({ '@context': defaults.context, '@graph': graph});
}


describe("JSON-LD helper simple tests", function () {
  var test_path;
  const utils = new jsonUtils();
  it("Test basic setup", function (done) {
	const crate = new ROCrate();
	crate.index();
	const rootDataset = crate.getRootDataset();
    assert(utils.hasType(rootDataset, "Dataset"));
    assert.equal(crate.json_ld["@context"] , "https://raw.githubusercontent.com/ResearchObject/ro-crate/master/docs/0.2-DRAFT/context.json", "Has standard context (defined in ./lib/defaults.js)")
    done();
  });
});

describe("Basic graph item operations", function() {
	const graph = [
  	 	{ '@id': 'https://foo/bar/oid1', 'name': 'oid1', 'description': 'Test item 1' },
  		{ '@id': 'https://foo/bar/oid2', 'name': 'oid2', 'description': 'Test item 2' }
	];

	it("can fetch items by id", function () {
		const crate = newCrate(_.clone(graph));
		crate.index();
		const item = crate.getItem('https://foo/bar/oid1');
		expect(item).to.have.property('@id', 'https://foo/bar/oid1');

	});

	it("can add an item", function() {
		const crate = newCrate(_.clone(graph));
		crate.index();

		const result = crate.addItem({
			'@id': 'https://foo/bar/oid3', 'name': 'oid3', 'description': 'Test item 3'
		});
		expect(result).to.be.true;
		const item = crate.getItem('https://foo/bar/oid3');
		expect(item).to.have.property('@id', 'https://foo/bar/oid3');


	});

	it("can't add an item with an already existing id", function() {
		const crate = newCrate(_.clone(graph));
		crate.index();

		const result = crate.addItem({
			'@id': 'https://foo/bar/oid1', 'name': 'oid1', 'description': 'Duplicate ID'
		});
		expect(result).to.be.false;


	});

});

describe("IDs and identifiers", function() {

	it("can generate unique ids", function() {
		const crate = newCrate();
		crate.index();
		const N = 20;

		_.times(N, () => {
			const id = crate.uniqueId('_:a');
			const success = crate.addItem({'@id': id});
			expect(success).to.be.true;
		});

		expect(crate.graph).to.have.lengthOf(N + 1) //+1 Cos of metdata file descriptor;
	});


	it("can add an identifier to the root dataset", function() {
		const crate = newCrate([ { 
			'@id': './',
			'path': './',          
			'@type': 'Dataset',
			'name': "Root dataset"
		}]);

		crate.index();


		const myId = uuid();
		const idId = crate.addIdentifier({
			'identifier': myId
		});

		expect(idId).to.not.be.false;

		const idItem = crate.getItem(idId);
		expect(idItem).to.not.be.undefined;
		expect(idItem).to.have.property("identifier", myId);

		const rootDataset = crate.getRootDataset();
		expect(rootDataset).to.have.property("identifier");
		const rid = rootDataset['identifier'];
		expect(rid).to.be.an('array').and.to.not.be.empty;
		const match = rid.filter((i) => i['@id'] === idId);
		expect(match).to.be.an('array').and.to.have.lengthOf(1);
	});


});


