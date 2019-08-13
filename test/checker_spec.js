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
const Checker = require('../lib/checker');
const chai = require('chai');
chai.use(require('chai-fs'));
const defaults = require("../lib/defaults");
const ROCrate = require("../lib/rocrate");


describe('Incremental checking', function () {
    it('should have trigger all the right reporting', async function () {
      //json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.jsonld"));
      json = {}
      var checker = new Checker(new ROCrate(json));
      assert(!checker.hasContext().status, "Does not have a @context");
      // Now with context
      json["@context"] = defaults.context;
      var checker = new Checker(new ROCrate(json));
      assert(checker.hasContext(),"Has a @context");
      // Don't have a dataset tho yet
      assert(!checker.hasRootDataset().status, "Does not have a root dataset");
      var dataset = {"@type": "Dataset", "path":  "./"}
      json["@graph"] = [dataset];
      var checker = new Checker(new ROCrate(json));
      assert(checker.hasRootDataset().status, "Does have a root dataset");
      // No name yet 
      assert(!checker.hasName().status, "Does not have a name");
      dataset.name = "";
      var checker = new Checker(new ROCrate(json));
      assert(!checker.hasName().status, "Does not have a name");
      dataset.name = "Name!";

      var checker = new Checker(new ROCrate(json));
      assert(checker.hasName().status, "Does have a name");
      assert(!checker.hasCreator().status, "Does not have creator");

      // Creator
      var creator1 = {"@id": "http://orcid.org/some-orcid", "name": "Some Person"}
      dataset.creator =  [{"@id": "http://orcid.org/some-orcid"}];
      json["@graph"].push(creator1);
      var checker = new Checker(new ROCrate(json));
      assert(!checker.hasCreator().status, "Does not have one or more creators with @type Person or Organization");

      // One good creator and one dodgy one
      var creator2 = {"@id": "http://orcid.org/some-other-orcid", "name": "Some Person", "@type": "Person"}
      dataset.creator.push({"@id": "http://orcid.org/some-other-orcid"});
      var checker = new Checker(new ROCrate(json));
      json["@graph"].push(creator1);
      assert(!checker.hasCreator().status, "Does not have one or more creators with @type Person or Organization");

      // One good creator
      dataset.creator = [creator2];
      json["@graph"] = [dataset, creator2];
      var checker = new Checker(new ROCrate(json));
      assert(checker.hasCreator().status, "Does have a creator with @type Person or Organization");

      // License
      // No name, description
      assert(!checker.hasLicense().status, "Does not have a license with @type CreativeWork");
      var license = {"@id": "http://example.com/some_kind_of_license", "@type": "CreativeWork", "URL": "http://example.com/some_kind_of_license"};
      dataset.license = {"@id": "http://example.com/some_kind_of_license"};
      json["@graph"].push(license);
      var checker = new Checker(new ROCrate(json));
      assert(!checker.hasLicense().status, "Does not have a license with @type CreativeWork");
      license.name = "Some license";
      license.description = "Description of at least 20 characters.";

      assert(checker.hasLicense().status, "Does have a license with @type CreativeWork and a name and descrpition");
 
 

      // datePublished
      assert(!checker.hasDatePublished().status, "Does not have a datePublished");
      dataset.datePublished = "2017"; // Not enough detail!
      assert(!checker.hasDatePublished().status, "Does not have a datePublished (not enough detail)");

  
      dataset.datePublished = ["2017-07-21", "2019-08-09"]; // this should do it
      assert(!checker.hasDatePublished().status, "Does not have a single datePublished");

      dataset.datePublished = ["2017-07-21"]; // this should do it
      assert(checker.hasDatePublished().status, "Does have a datePublished");

      //contactPoint missing
      assert(!checker.hasContactPoint().status, "Does not have  a single contact point");
      var contact = {"@id": "some.email@example.com", "@type": "ContactPoint"} // Not enough
      dataset.contactPoint = [{"@id": "some.email@example.com"}];
      json["@graph"].push(contact);
      var checker = new Checker(new ROCrate(json));
      assert(!checker.hasContactPoint().status, "Does not have   a contact point with enough properties");
      contact.contactType = 'customer service';
      contact.email = 'some@email'; // TODO: Not validated!
      var checker = new Checker(new ROCrate(json));
      assert(checker.hasContactPoint().status, "Does have a proper contact point");

      
      checker.check();
      console.log(checker.report());


    });
});


after(function () {
  //TODO: destroy test repoPath

});

