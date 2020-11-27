
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
