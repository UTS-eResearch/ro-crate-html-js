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

const defaults = require('./defaults');
const utils = require('./utils')

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
            this.json_ld = {
                "@context": defaults.context,
                "@graph":  [
                    root
                ]
            }
        } else {
            // TODO DIE if not correct
            this.json_ld = json;
            
        }
        this.utils = new utils();
    }
    index() {
        this._item_by_id = {};
        this._item_by_url = {};
        this._item_by_type = {}; // dict of arrays
        this.items_by_new_id = {}
        this.graph = this.json_ld["@graph"];
        this.graph = this.json_ld["@graph"] ? this.json_ld["@graph"] : [];
        for (let i = 0; i < this.graph.length; i++) {
            var item = this.graph[i];
            if (item["@id"]) {
                this._item_by_id[item["@id"]] = item;
            }
            if (item["path"]) {
                this._item_by_url[item["path"]] = item;
            }
            for (let t of this.utils.asArray(item["@type"])) {
                if (!this._item_by_type[t]) {
                    this._item_by_type[t] = [];
                }
                this._item_by_type[t].push(item);
            }
        }
        this._rootNode = this._item_by_url["./"];
        this._rootId = this._rootNode ? this._rootNode['@id'] : undefined;
    }
   getItem(id) {
       return this._item_by_id(id);
   }
   getRootDataset() {
        return this._rootNode;
    }
}

module.exports = ROCrate;