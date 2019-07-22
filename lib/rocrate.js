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

const defaults = require("./defaults");

const DATASET_TEMPLATE = {
    "@type": "Dataset",
    "@id": "",
    "path": "./"
   }

class ROCrate {
    // Class for building, navigating, testing and rendering ROCrates (TODO: import validation and rendering from Calcyte)
    constructor(json) {
        if  (!json) {
            this.rootDataset = JSON.parse(JSON.stringify(DATASET_TEMPLATE));
            this.json = {
                "@context": defaults.context,
                "@graph":  [
                    root
                ]
            }
        }
    }
}

module.exports = ROCrate;