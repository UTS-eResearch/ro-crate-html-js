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

const assert = require("assert");
const fs = require("fs-extra");
const Preview = require("../lib/ro-crate-preview-wrapper");
const HtmlFile = require("../lib/ro-crate-preview-file");
const { ROCrate } = require("ro-crate");
const StaticPathUtils = require("../lib/static_utils");

const chai = require("chai");
chai.use(require("chai-fs"));

describe("Stub geolocation tests", function () {
    it("can run displayPlaces", async function () {
        this.timeout(5000);
        json = JSON.parse(
            fs.readFileSync("test_data/sample-ro-crate-metadata.json")
        );
        const crate = new ROCrate(json);
        const preview = new Preview(crate, {
            utils: new StaticPathUtils(),
            geoURL: "http://localhost"
        });
        const placename = 'Somewhere in Iowa';
        const fc = {
            type: "FeatureCollection",
            features: [
                {
                type: "Feature",
                geometry: {
                    name: placename,
                    type: "Point",
                    coordinates: [ 41.0000, 93.000 ]
                    }
                }   
            ]
        };
        preview["places"] = fc;
        const maphtml = await preview.displayPlaces();
        assert(maphtml, "Got a map");
        const placere = RegExp(placename);
        assert(maphtml.match(placere), "Found our place name in the HTML")
    });
});

after(function () {});
