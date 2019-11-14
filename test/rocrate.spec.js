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
	if (!graph) {graph = [defaults.datasetTemplate, defaults.metadataFileDescriptorTemplate]};

	return new ROCrate({ '@context': defaults.context, '@graph': graph});
}


describe("JSON-LD helper simple tests", function () {
  var test_path;
  const utils = new jsonUtils();

  it("Test basic setup", function (done) {
	// No Datadet
	const dudCrate = newCrate();	
	try {
		dudCrate.index();
      } catch (e) {
        assert.strictEqual(e.message, 'There is no root dataset');
      }
	const crate = new ROCrate();
	crate.index();
	const rootDataset = crate.getRootDataset();
    assert(utils.hasType(rootDataset, "Dataset"));
    assert.equal(crate.json_ld["@context"] , "https://raw.githubusercontent.com/ResearchObject/ro-crate/master/docs/0.3-DRAFT/context.json", "Has standard context (defined in ./lib/defaults.js)")
    done();
  });
});

describe("Basic graph item operations", function() {
	const graph = [
		defaults.metadataFileDescriptorTemplate,
		defaults.datasetTemplate,
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

		expect(crate.graph).to.have.lengthOf(N + 2) //+1 Cos of root metdata file descriptor;
	});


	it("can add an identifier to the root dataset", function() {
		const crate = newCrate();
		crate.index();
		const myId = uuid();
		const idCreated= crate.addIdentifier({
			'identifier': myId,
			"name": "local-id"
		});
		expect(idCreated).to.not.be.false;
		const idItem = crate.getItem(idCreated);
		expect(idItem).to.not.be.undefined;
		expect(idItem).to.have.property("value", myId);
		const rootDataset = crate.getRootDataset();
		expect(rootDataset).to.have.property("identifier");
		const rid = rootDataset['identifier'];
		expect(rid).to.be.an('array').and.to.not.be.empty;
		const match = rid.filter((i) => i['@id'] === idCreated);
		expect(match).to.be.an('array').and.to.have.lengthOf(1);
		expect(crate.getNamedIdentifier("local-id")).to.equal(myId);
	});
	

	it("can add an identifier when the existing identifier is a scalar", function() {
		const crate = newCrate();
		crate.index();
		const root = crate.getRootDataset();
		root['identifier'] = 'a_scalar_identifier';
		const myId = uuid();
		const idCreated= crate.addIdentifier({
			'identifier': myId,
			"name": "local-id"
		});
		expect(idCreated).to.not.be.false;
		const idItem = crate.getItem(idCreated);
		expect(idItem).to.not.be.undefined;
		expect(idItem).to.have.property("value", myId);
		const rootDataset = crate.getRootDataset();
		expect(rootDataset).to.have.property("identifier");
		const rid = rootDataset['identifier'];
		expect(rid).to.be.an('array').and.to.not.be.empty;
	});

	it("can read an identifier from the root dataset", function() {
		const crate = newCrate();
		crate.index();
		const myId = uuid();
		const namespace = "local-id";
		const idCreated= crate.addIdentifier({
			'identifier': myId,
			"name": namespace
		});

		const jsonld = crate.getJson();

		const crate2 = new ROCrate(jsonld);

		crate2.index();
		const myId2 = crate2.getNamedIdentifier(namespace);
		expect(myId2).to.equal(myId);
	});

	it ("can turn a flattened graph into a nested object", async function() {
	  json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
	  const crate = new ROCrate(json);
	  await crate.objectify();
	  console.log(crate.objectified);
	  
	});
	

	it ("it doesn't die if you feed it circular references", async function() {
		json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
		const crate = new ROCrate(json);
		crate.index();
		const root = crate.getRootDataset();
		const creator = crate.getItem(root.creator["@id"]);
		creator.partOf = [{"@id": "./"}];
		await crate.objectify();
		console.log(crate.objectified);
		console.log(crate.objectified.creator.name)
		console.log(crate.objectified.creator.partOf)
	  });

});


