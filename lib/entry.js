
const Preview = require("./ro-crate-preview");
const Checker = require("./checker");
const ROCrate = require("ro-crate").ROCrate;
    

var meta;
var preview;
const check = function check() {
    var checker = new Checker(meta);
    checker.check();
    $("div.check").html(
        `<details><summary>${checker.summarize()}</summary><a href='#___check____'><pre>${checker.report()}</pre></a></details>`
    );
};

async function load() {
    if (!meta) {
         meta = new ROCrate(
                 JSON.parse(document.querySelector('script[type="application/ld+json"]').innerHTML)
        );
        preview = await new Preview(meta);
        meta.resolveContext().then(function () {updatePage()}); // This is async
    }
    //$("div.check").html("<button><a href='#___check____'>Check this crate</a></button>")
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
//window.onload(load);
