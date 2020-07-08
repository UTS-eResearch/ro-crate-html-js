
class Page {
    constructor(args) {
        this.pageSize = args.pageSize || 5;
        var values = args.values;
        //Values is an array (or singleton) of strings / or objects
        if (!Array.isArray(values)) {
            values = [values];
        }            
        this.pages = [];
        this.values = [];

        const l = values.length;
        this.first = values[0];
        [this.last] = values.slice(-1);
        if (l <= this.pageSize) {
            this.values = values;
        }
        else if (l <= this.pageSize * this.pageSize) {
            for (let s = 0; s <= l ; s += this.pageSize)
            {
                this.pages.push(new Page({values: values.slice(s, s + this.pageSize), pageSize: this.pageSize}));
            }
       } else {
            for (let s = 0; s < l ; s += this.pageSize * this.pageSize)
            {
                this.pages.push(new Page({values: values.slice(s, s + this.pageSize * this.pageSize), pageSize: this.pageSize} ))
            }
          }
        }
}
module.exports = Page;

