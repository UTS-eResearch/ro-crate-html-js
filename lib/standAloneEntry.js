/* 

This is part of ro-crate-html-js a tool for generating HTMl 
previews of HTML files.

Copyright (C) 2021  University of Technology Sydney

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
const Preview = require("./ro-crate-preview");
const Checker = require("./checker");
const ROCrate = require("ro-crate").ROCrate;
// This bit is specific to fragmented crates - write a new set of utils for other environments
const StaticUtils = require("./static_utils");
var meta;
var preview;



async function load() {
    if (!meta) {
         meta = new ROCrate(
                 JSON.parse(document.querySelector('script[type="application/ld+json"]').innerHTML)
        );
        config.utils = new StaticUtils();
        preview = await new Preview(meta, config, entryId);
        // TODO - this is not a proper interface.
        preview.places = places;
        meta.resolveContext().then(function () {updatePage()}); // This is async
    }
    updatePage();
}

window.onhashchange = function () {
    load();
};

window.onload = function () {
    load();
};



async function updatePage() {
    var hash = location.hash;
    if (hash.startsWith("#___check")) {
        check();
    } else if (hash) {
        await preview.display(unescape(hash.replace("#", "")));
    } else {
        await preview.display(entryId);
    }
}
//window.onload(load);
