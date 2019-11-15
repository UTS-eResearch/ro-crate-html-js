const path = require("path");
const fs = require("fs");
const ejs  = require("ejs");

class HtmlFile  {
    constructor(preview) {
        this.preview = preview;
    }
    async  render(zip_path, render_script) {
        const templatePath = path.join(__dirname, "..", "defaults", "metadata_template.html");
        var temp = fs.readFileSync(templatePath, { encoding: "utf8" });
        this.preview.template = ejs.compile(temp);
        this.preview.crate.index();
        
        var rootNode = this.preview.crate.getRootDataset();
        var name = rootNode.name;
        if (!render_script) {
            render_script = this.preview.crate.defaults.render_script;
        }
        if (zip_path) {
            zip_path = `<a href='${zip_path}'>Download this Dataset</a>`;
        }
        const summary = await this.preview.summarizeDataset();
        var date = new Date(); 
        var timestamp = date.getTime(); 
        return this.preview.template({
            html: summary.html(),
            dataset_name: name,
            item_name: name,
            citation: this.preview.text_citation,
            zip_link: zip_path,
            up_link: "",
            time_stamp: timestamp,
            ROCrate_version: this.preview.crate.defaults.ROCrate_version,
            spec_id: this.preview.crate.defaults.DataCrate_Specification_Identifier,
            json_ld: JSON.stringify(this.preview.crate.getJson(), null, 2),
            render_script: render_script
        })  
    }
 }

 module.exports = HtmlFile;