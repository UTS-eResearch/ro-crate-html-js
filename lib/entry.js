
const Preview = require("./ro-crate-preview");
const Checker = require("./checker");
const ROCrate = require("ro-crate").ROCrate;

// const $ = require("jquery");

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
    meta = new ROCrate(
        JSON.parse($("script[type='application/ld+json']").text())
    );
    preview = await new Preview(meta);
    //$("div.check").html("<button><a href='#___check____'>Check this crate</a></button>")
    var hash = location.hash;
    if (hash.startsWith("#___check")) {
        check();
    } else if (hash) {
        await preview.display(unescape(hash.replace("#", "")));
    } else {
        await preview.display(preview.root["@id"]);
    }
}

window.onhashchange = function () {
    load();
};

$(document).ready(load);
