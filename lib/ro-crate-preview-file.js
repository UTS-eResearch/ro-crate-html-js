const path = require("path");
const fs = require("fs");
const ejs  = require("ejs");

class HtmlFile  {
    constructor(preview) {
        this.preview = preview;
    }
    async  render(render_script) {
        const templatePath = path.join(__dirname, "..", "defaults", "metadata_template.html");
        var temp = fs.readFileSync(templatePath, { encoding: "utf8" });
        this.preview.template = ejs.compile(temp);
        this.preview.crate.index();
        await this.preview.crate.resolveContext();
        var rootNode = this.preview.crate.getRootDataset();
        var name = rootNode.name;
        if (!render_script) {
            render_script = this.preview.crate.defaults.render_script;
        }
           
        const summary = await this.preview.summarizeDataset();
    
        var date = new Date(); 
        var timestamp = date.getTime(); 
        return this.preview.template({
            html: summary,
            dataset_name: name,
            item_name: name,
            citation: this.preview.text_citation,
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