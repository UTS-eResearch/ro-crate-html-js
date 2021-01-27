
const Preview = require("./ro-crate-preview");
const Checker = require("./checker");
const ROCrate = require("ro-crate").ROCrate;
const { config } = require("chai");

var meta;
var preview;

async function check() {
    var checker = new Checker(meta);
    await checker.check();
    document.getElementById("check").innerHTML = `<details><summary>${checker.summarize()}</summary><a href='#___check____'><pre>${checker.report()}</pre></a></details>`;
};

async function load() {
    if (!meta) {
         meta = new ROCrate(
                 JSON.parse(document.querySelector('script[type="application/ld+json"]').innerHTML)
        );
        preview = await new Preview(meta, config);
        meta.resolveContext().then(function () {updatePage()}); // This is async
    }
    document.getElementById("check").innerHTML = "<button><a href='#___check____'>Check this crate</a></button>";
    console.log("CHECK", document.getElementById("check").innerHTML)
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
        await preview.display(preview.root["@id"]);
    }
}
