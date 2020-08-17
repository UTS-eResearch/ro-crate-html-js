/* This is part of the RO-Crate tolls for implementing the RoCrate data packaging
spec.  Copyright (C) 2020  University of Technology Sydney

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
const {DisplayableItem, DisplayableProp, DisplayableValue} = require('./displayable');
const chai = require('chai');
chai.use(require('chai-fs'));
const ROCrate = require("ro-crate").ROCrate;
const fs = require("fs");



describe('Value', function () {
    it('Works out how to display values', function () {
        crate = new ROCrate();
        crate.index();
        const root = crate.getRootDataset();
        const loc1 = {"@id": "#Location1", "name": "Location 1", "@type": "geo"};
        const place1 = {"@id": "#Place1", "name": "Place 1", "@type": "Place", "location": {"@id": loc1["@id"]}};
        const item1 = {"@id": "#Person1", "name": "Person 1", "@type": "Person", "birthPlace": {"@id": place1["@id"]}};
        const doc1 = {"@id": "#doc1", "name": "Doc 1", "@type": "CreativeWork", "about": {"@id": item1["@id"]}}  
        crate.addItem(loc1);
        crate.addItem(item1);
        crate.addItem(place1);
        crate.addItem(doc1);
        //crate.addBacklinks();
        const config1 = {}
        const dispVal = new DisplayableValue(crate, "Text", config1);
        assert.equal(dispVal.url, null);
        assert.equal(dispVal.text, "Text");
      
    });
});

describe('Make Displayable', function () {
    it('Creates a displayable item-graph', function () {
        crate = new ROCrate();
        crate.index();
        const root = crate.getRootDataset();
        const loc1 = {"@id": "#Location1", "name": "Location 1", "@type": "geo"};
        const place1 = {"@id": "#Place1", "name": "Place 1", "@type": "Place", "location": {"@id": loc1["@id"]}, "about": {"@id": "./"}};
        const item1 = {"@id": "#Person1", "name": "Person 1", "@type": "Person", "birthPlace": {"@id": place1["@id"]}};
        const doc1 = {"@id": "#doc1", "name": "Doc 1", "@type": "CreativeWork", "about": {"@id": item1["@id"]}}


        crate.addItem(loc1);
        crate.addItem(item1);
        crate.addItem(place1);
        crate.addItem(doc1);
        crate.addBackLinks();

        root.about = {"@id": item1["@id"]};
        root.name = "testcrate";

        const config1 = {}
        const dispItem = new DisplayableItem(crate, "./", config1);
        //console.log(dispItem);

        assert.equal(dispItem.displayableProps.about.paginatedValues.values.length, 1)
        assert.equal(dispItem.displayableProps.about.name, "about");
        const dispItem2 = dispItem.displayableProps.about.paginatedValues.values[0].displayableItem;
        
        assert.equal(dispItem2.itemID, "#Person1")

        const dispItem3 = dispItem2.displayableProps.birthPlace.paginatedValues.values[0].displayableItem;
        assert.equal(dispItem3.itemID, "#Place1")
        
        assert.equal(dispItem3.displayableReverseProps.birthPlace.paginatedValues.first.text, "Person 1");


        
    });
   

    
});

