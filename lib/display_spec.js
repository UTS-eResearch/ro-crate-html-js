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
const {displayDisplayableValue, displayDisplayableProp, displayDisplayableItem, renderPage} = require('./display');
const Pruner = require('./prune-crate');

const chai = require('chai');
chai.use(require('chai-fs'));
const ROCrate = require("ro-crate").ROCrate;
const fs = require("fs");



describe('Value', function () {
    it('Works out how to display values', function () {
        crate = new ROCrate();
        crate.index();
        const config1 = {}

        const dispVal = new DisplayableValue(crate, "Text", config1);
        assert.equal(displayDisplayableValue(dispVal), "Text");

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

        const dispVal1 = new DisplayableValue(crate, {"@id": place1["@id"]}, config1);
        assert.equal(displayDisplayableValue(dispVal1), `<span><a href="#Place1">Place 1</a></span>`);
        root.name = "Test Crate"
        const dispItem = new DisplayableItem(crate, "./", config1);
    
       
    });

     
    it('Works on a big real crate', function () {
        const json = JSON.parse(fs.readFileSync("test_data/convictions-metadata.json"));
        crate = new ROCrate(json);
        crate.index();
        crate.addBackLinks();

        const root = crate.getRootDataset();
        


        const config1 = {
                "types": {"Person" : {
                                "props" :  {"birthPlace": {}},
                                "reverseProps": {"object": 
                                      {"types" :  
                                         {"Action" : {
                                                "props" :  {"location":
                                                   {"types": {"Place": {"props": {"geo": {}}}}}},
                                                }
                                     }
                            
                             }
                        }
                    }
                }
            }
        const item1 = crate.getItem("#person__VICFP_18551934_6_249");
        const Pruner1 = new Pruner(crate, config1)
        const pruned1 = Pruner1.prune(item1);
        pruned1.addBackLinks();
        console.log(pruned1.getItem("#person__VICFP_18551934_6_249"))
        const dispItem = new DisplayableItem(pruned1, "#person__VICFP_18551934_6_249", config1);
        dispItem.displayFunction = displayDisplayableItem;
        const html = renderPage(dispItem);

        fs.writeFileSync("test.html", html);

       
    });


    it('Works on a the sample crate', function () {
        const json = JSON.parse(fs.readFileSync("test_data/sample-ro-crate-metadata.json"));
        crate = new ROCrate(json);
        crate.index();
        crate.addBackLinks();

        const root = crate.getRootDataset();
        


        const dispItem = new DisplayableItem(crate1, "./", {});
        dispItem.displayFunction = displayDisplayableItem;
        const html = renderPage(dispItem);

        fs.writeFileSync("test.html", html);

       
    });
});

  
    


