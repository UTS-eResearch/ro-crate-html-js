const Config = require("./static-html-config");
const config = new Config();
const renderPage = require("../defaults/metadata_template.js");


function displayDisplayableValue(dv, opts) {
   if (!opts) {opts = {summary: false, noLink: false}}
   const {summary, noLink} = opts;
   var html = "";
   if (!summary && dv.displayableItem) {
        html += displayDisplayableItem(dv.displayableItem, true);
   } else if (dv.url && !noLink) {
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
            if (p.first && p.last) {
                html += `
                        <details style='margin-left: 3%'>
                            <summary>
                                ${displayDisplayableValue(p.first, {summary: true, noLink: true})} -to- ${displayDisplayableValue(p.last,  {summary: true, noLink: true})}
                            </summary>
                            ${displayPage(p)}
                        </details>
                `;
            }
        }
    } else {
        if (page.values.length > 1 ) {
            html += "";
            for (let p of page.values) {
                html += `
                        <div>${displayDisplayableValue(p)}</div>
                        `;
            }
            html += "";
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
            <dl>
              <dt>${dp.name}</dt>
              <dd>${displayPage(dp.paginatedValues)}</dd>
            </dl>
            `;
    } else {
        html += `
            <span>${displayPage(dp.paginatedValues)}</span>
            `;
    }
    return html;
 }

 function displayDisplayableProps(di) {
    // dp is a displayableItem
    var html =``;
    for (let prop of Object.keys(di.displayableProps)) {
        if (!di.doNotDisplayProps[prop]) {
            html += displayDisplayableProp(di.displayableProps[prop])
        }
    }
   return html;
 }

 function displayDisplayableReverseProps(di) {
    // dp is a displayableItem
    var html = ``;
    if (Object.keys(di.displayableReverseProps).length > 0)
    {
        html +=`
            <dl>
            <dt>Reverse Properties</dt>
            <dd>
            `
            for (let prop of Object.keys(di.displayableReverseProps)) {
                if (!di.doNotDisplayReverseProps[prop]) {
                    html += `${displayDisplayableProp(di.displayableReverseProps[prop])}`
                }
            }
        html += `
            </dd>
            </dl>
             `
    

    }
   return html;
 }
 
 function displayDisplayableItem(di, embedded) {
    di.doNotDisplayProps["name"] = true;
    di.doNotDisplayProps["@id"] = true;
    di.doNotDisplayProps["@type"] = true;

    var html = `<div id="${di.itemID}">`;
    var linkStartTag = "";
    var linkEndTag = ""

    if (di.relPath) {
        linkStartTag = `<a href="${di.getLink()}">`;
        linkEndTag   = "</a>";
    }


    if (Object.keys(di.displayableProps).length < 4) {
        html += `
            <dl>
            <dt>${displayDisplayableProp(di.displayableProps["@type"], false)}:
            ${linkStartTag}${displayDisplayableProp(di.displayableProps.name, false)}${linkEndTag}</dt>
            <dd>
            ${displayDisplayableProps(di)}
            ${displayDisplayableReverseProps(di)}
            <dd>
            </dl>
            `;

    } else if (embedded) { 
        html += `
        <details>
            <summary>
                ${displayDisplayableProp(di.displayableProps["@type"], false)}:
                ${linkStartTag}${displayDisplayableProp(di.displayableProps.name, false)}${linkEndTag}
            </summary>
            ${displayDisplayableProps(di)}
            ${displayDisplayableReverseProps(di)}
        </details>
    `;
    } else {
        html += `
            
                ${displayDisplayableProps(di)}
                ${displayDisplayableReverseProps(di)}
          
        `;
    }
    html += "</div>";
    return html;
 }

  
 module.exports = {
    displayDisplayableValue: displayDisplayableValue,
    displayDisplayableProp: displayDisplayableProp,
    displayDisplayableItem: displayDisplayableItem,
    renderPage: renderPage
 }

