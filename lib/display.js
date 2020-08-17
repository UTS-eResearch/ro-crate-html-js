const Config = require("./static-html-config");
const config = new Config();
const Page = require("./paginate");
const $ = require("cheerio");
const renderPage = require("../defaults/metadata_template.js");


function displayDisplayableValue(dv) {
   var html = "";
   if (dv.displayableItem) {
        html += displayDisplayableItem(dv.displayableItem);
   } else if (dv.url) {
        html = `
                <span><a href="${dv.url}">${dv.text}</a></span>
               `;
        }
   else {
        html = dv.text;
   }
   return html;
}


function displayPage(page) {
    var html = "";
    if (page.pages.length > 0) {
        for (let p of page.pages) {
            html += `
                    <details style='margin-left: 3%'>
                        <summary>
                            ${displayDisplayableValue(p.first)} -to- ${displayDisplayableValue(p.last)}
                        </summary>
                        ${displayPage(p)}
                    </details>
            `;
        }
    } else {
        if (page.values.length > 1 ) {
            html += "<ul>\n";
            for (let p of page.values) {
                html += `
                        <li>${displayDisplayableValue(p)}</li>
                        `;
            }
            html += "</ul>\n";
        } else if (page.values[0]) {
            html += `<span>${displayDisplayableValue(page.values[0])}</span>`;
        }
    }
    html += "";
    return html;
 }

function displayDisplayableProp(dp, showName) {
    // dp is a displayableProp
    if (showName == undefined) {
        showName = true;
    }
    var html = "";
    if (showName) {
        html = `
            <div class="row">
              <div class="col-sm-2">${dp.name}</div>
              <div class="col-sm-10">${displayPage(dp.paginatedValues)}</div>
            </div>
            `;
    } else {
        html += `
            <div class="values">${displayPage(dp.paginatedValues)}</div>
            `;
    }
    return html;
 }

 function displayDisplayableProps(di) {
    // dp is a displayableItem
    var html =`<div class="container">`;
    for (let prop of Object.keys(di.displayableProps)) {
        if (!di.doNotDisplayProps[prop]) {
            html += displayDisplayableProp(di.displayableProps[prop])
        }
    }
    html += `
        </div>
        `
   return html;
 }

 function displayDisplayableReverseProps(di) {
    // dp is a displayableItem
    var html = ``;
    if (Object.keys(di.displayableReverseProps).length > 0)
    {
        html +=`
            <p>REVERSE</p>
            <div class="container">
            `
            for (let prop of Object.keys(di.displayableReverseProps)) {
                if (!di.doNotDisplayProps[prop]) {
                    html += displayDisplayableProp(di.displayableReverseProps[prop])
                }
            }
        html += `
             </div>
             `
    

    }
   return html;
 }
 
 function displayDisplayableItem(di) {
    di.doNotDisplayProps["name"] = true;
    di.doNotDisplayProps["@id"] = true;
    di.doNotDisplayProps["@type"] = true;
    var html = "<div>";
    html += `
        <div>
            <div>${displayDisplayableProp(di.displayableProps.name, false)}</div>
            ${displayDisplayableProps(di)}
            ${displayDisplayableReverseProps(di)}
        </div>
    `;
    html += "</div>";
    return html;
 }

  


 module.exports = {
    displayDisplayableValue: displayDisplayableValue,
    displayDisplayableProp: displayDisplayableProp,
    displayDisplayableItem: displayDisplayableItem,
    renderPage: renderPage
 }

