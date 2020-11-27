L.Control.SliderControl = L.Control.extend({
    options: {
        position: 'topright',
        layers: null,
        timeAttribute: 'time', //set to the var the marker uses as its time attribute (or start time)
        isEpoch: false,     // whether the time attribute is seconds elapsed from epoch
        startTimeIdx: 0,    // where to start looking for a timestring
        timeStrLength: 19,  // the size of  yyyy-mm-dd hh:mm:ss - if millis are present this will be larger
        maxValue: -1,
        minValue: -1,
        showAllOnStart: true,
        markers: null,
        range: false,
        follow: false,
        alwaysShowDate : false,
        rezoom: null,
        endTimeAttribute: null, //if null item is assumed to occur at one specific time (eg murder committed in 1833), if not null item exits within a time period (eg a courthouse is active from 1812 to 1855) - set to the var the marker uses as end date
        clusters: false //user sets this to true if they want close together markers to form a cluster (greatly improves usability)
    },
    
    initialize: function (options) {
        L.Util.setOptions(this, options);
        this._layer = this.options.layer;
    },

    //setup
    onAdd: function (map) { //when this control is added to the map for the first time
        this.options.map = map
        this.options.showUndefined = true

        if (this.options.clusters) this.options.clusters = L.markerClusterGroup() //setup the cluster group
    
        // Create a control sliderContainer with a jquery ui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container)
        $(sliderContainer).append('<div id="leaflet-slider"><div class="ui-slider-handle"></div><div id="slider-timestamp"></div></div>')
        
        //Prevent map panning/zooming while using the slider
        $(sliderContainer).mousedown(function () {map.dragging.disable();});

        //Release the mouse, reenable panning
        $(document).mouseup(function () {map.dragging.enable();});
    
        var options = this.options
        options.markers = []

        //Our layer of markers
        if (this._layer) {
            var self = this; //access the correct 'this' from the sub functions using the self variable
            var all_features = new Map(), t, zero_values = [] //map data structure, a faster associative array
            
            // all_features(t) is an array for the relevant markers
            this._layer.eachLayer(function (layer) {
                t = layer.options[options.timeAttribute] //start date
                if (t === undefined) zero_values.push(layer) //if undefined put into its own array
                else {
                    if (!all_features.has(t)) all_features.set(t,[]); //create a new array for this start date
                    all_features.get(t).push(layer) //push this layer into the array for its start date
                }
            });

            //sort unique values - this will in turn keep the features in the right order later on
            all_features = new Map([...all_features.entries()].sort(
                (a,b) => {
                    return (self.extractTimestamp(a[0]) > self.extractTimestamp(b[0])) || (self.extractTimestamp(a[0]) == self.extractTimestamp(b[0]) ? 0 : -1)
                }
            )) //may need to be extended later to handle dates, currently sorts by unicode val (should convert to standard datetime then sort by datetime)

            //create min max value labels
            options.unique_time_values = Array.from(all_features.keys()) //simple array of all the start dates
            var min = options.unique_time_values[0]
            var max = options.unique_time_values[options.unique_time_values.length-1]
            $(sliderContainer).prepend('<div><span><label>' + min + '</label></span>' + '<span class="float-right"><label>' + max + '</label></span></div>') //min max label

            // Create tick box to hide/show items with no date
   
            
            var undefinedCheckbox = document.createElement("INPUT")
            undefinedCheckbox.setAttribute("type","checkbox")
            undefinedCheckbox.setAttribute("id","showundefined")

            //The div to hold this checkbox
            var undefinedDiv = document.createElement("DIV")
            undefinedDiv.setAttribute("id","undefined-div")

            //pop the checkbox into the div, and the div into the sliderContainer
            $(undefinedDiv).append(undefinedCheckbox,'<label for="showundefined"> Show items that have no dates</label></div>')
            $(sliderContainer).append(undefinedDiv)
            

            //push the undefined values onto the control options as a unique variable
            options.zero_values = L.featureGroup(zero_values);
            
            //Add a counter div for the markers
            var markerCountDiv = document.createElement("DIV")
            markerCountDiv.setAttribute("id","markerCountDiv")
            $(markerCountDiv).html('Count: ' + self.getMarkerCount())
            $(sliderContainer).append(markerCountDiv) //put into slider container
            
            //add an event to the checkbox that shows/hides these undefined date markers when clicked
            $(undefinedCheckbox).change(function() {
                if (this.checked) { //show markers
                    options.showUndefined = true
                    if (options.clusters) options.clusters.addLayer(options.zero_values)
                    else map.addLayer(options.zero_values)
                }
                else { //remove markers
                    options.showUndefined = false
                    if (options.clusters) options.clusters.removeLayer(options.zero_values)
                    else map.removeLayer(options.zero_values)
                }
                $(markerCountDiv).html(self.getMarkerCountText(self.getMarkerCount())) //update the text for the marker count with the current number showing
            })
                        
            options.maxValue = all_features.size - 1;
            options.all_features = all_features
            options.minValue = 0

            //display the first set of markers on load
            this.buildMarkers() //build the markers list
            if (options.range) this.displayMarkers(min,min) //custom function to get appropriate markers with active dates between between range
            else this.displayMarkers(min)

            //set the initial marker count text
            $(markerCountDiv).html(self.getMarkerCountText(self.getMarkerCount()))



            //Finishing up
            this.options = options;

        } else {
            console.log("Error: You have to specify a layer via new SliderControl({layer: your_layer});");
        }
        return sliderContainer;

    },
    
    onRemove: function () { //unsure if this method is ever called
        //Delete all markers which where added via the slider and remove the slider div
        for (i = 0; i < this.options.markers.length; i++) {
            this.options.map.removeLayer(this.options.markers[i]);
        }
        $('#leaflet-slider').remove();
        console.log("onRemove was called") //debug
    },
    
    //Primary function
    startSlider: function () {
        var self = this; //var for calling back to functions in this file from sub-functions (where this no longer refers to this file)
        var _options = self.options //simpler call for options

        //Initial Timestamp
        if (_options.range) self.setTimestamp(_options.unique_time_values[0],_options.unique_time_values[0])
        else self.setTimestamp(_options.unique_time_values[0])

        $("#leaflet-slider").slider({ //creating the slider instance for the first time
            range: _options.range,
            value: _options.minValue,
            values: _options.values,
            min: _options.minValue,
            max: _options.maxValue,
            step: 1,
            slide: function (e, ui) { //event for when the slider is moved 
                var map = _options.map;
                var fg = L.featureGroup();

                var from_index = (_options.range) ? ui.values[0] : ui.value
                var to_index = (_options.range) ? ui.values[1] : null
                var from = _options.unique_time_values[from_index]
                var to = (_options.range) ? _options.unique_time_values[to_index] : null

                if(!!_options.markers[ui.value]) { //if there are markers for this slider value? (there always should be unless an error has occurred)
                    //SETTING TIMESTAMP
                    if(_options.markers[ui.value].feature !== undefined) { //if marker is a json feature
                        if(_options.markers[ui.value].feature.properties[_options.timeAttribute]){
                            if(_options.markers[ui.value]) self.setTimestamp(_options.unique_values[ui.value].feature.properties[_options.timeAttribute])
                        } else {
                            console.error("Time property "+ _options.timeAttribute +" not found in data");
                        }
                    }
                    else { //else marker is a leaflet vector
                        if (from) self.setTimestamp(from,to)
                        else console.error("One of the sliders is out of range for this dataset")         
                    }
    
                    //CLEAR MARKERS - Don't clear all layers, just ones with markers that don't have undefined dates (markers[0] is zero_values - the array of markers with undefined dates)
                    self.clearMarkers()
                    
                    //DISPLAY MARKERS
                    self.displayMarkers(from, to) //if range is false, to is null - this is handled in the displayMarkers function
                };

                if(_options.rezoom) { //automatically rezoom the map TODO:
                    map.fitBounds(fg.getBounds(), {
                        maxZoom: _options.rezoom
                    });
                }

                //UPDATE MARKER COUNT
                $('#markerCountDiv').html(self.getMarkerCountText(self.getMarkerCount()))
            }
        });
    },

    clearMarkers: function() { //remove all markers/clusters from map - resets the cluster group
        if (this.options.clusters) {
            this.options.map.removeLayer(this.options.clusters)
            this.options.clusters = L.markerClusterGroup()
        }
        else {
            for (var i = 1; i < this.options.markers.length; i++) {
                if(this.options.markers[i]) this.options.map.removeLayer(this.options.markers[i]); 
            }
        }
    },

    getMarkerCount: function() {
        var mcount = 0
        if (this.options.clusters) {
            this.options.clusters.eachLayer((layer) => {
                mcount++
            })
        }
        else {
            this.options.map.eachLayer((l) => {
                if (l instanceof L.Marker) mcount++
            })
        }
        return mcount;
    },

    getMarkerCountText: function(count) {
        return "Marker Count: " + count;
    },
    
    extractTimestamp: function(time) { //TODO: convert time from field to an appropriate date format, 'time' variable should be set when instantiating this object
        //time could be in many different forms, for our simplified purpose we will start with just using 4 digit years
       
        var t = new Date(time);
        return t;
    },

    setTimestamp: function(from,to=null) {
        if (!to) $('#slider-timestamp').html(this.extractTimestamp(from).toDateString())
        else $('#slider-timestamp').html(this.extractTimestamp(from).toDateString() + ' - ' + this.extractTimestamp(to).toDateString())
    },

    displayMarkers: function(from,to=null) {
        var _options = this.options
        var map = _options.map
        var data = _options.all_features
        var keys = data.keys(), key
        var _extractTimestamp = this.extractTimestamp

        from = _extractTimestamp(from)
        to = _extractTimestamp(to)

        if (to) { //if ranged slider is on to != null
            while (!(key = keys.next()).done) { //for each entry in the features Map()
                if (_extractTimestamp(key.value) > to) break //keys are ordered, if we are already out of range just stop searching
                var arr = data.get(key.value)
                arr.forEach(function(item) {
                    var start = _extractTimestamp(item.options[_options.timeAttribute])
                    var end = _extractTimestamp(item.options[_options.endTimeAttribute])
                    //console.log(start + " ------- " + to + " ------- " + (start <= to))
                    if (_options.endTimeAttribute) { //if items on this map have a start and end date 
                        if (start <= to && (end >= from || end === undefined)) { //UNDEFINED END DATE MEANS IT IS CURRENTLY ACTIVE!
                            if (_options.clusters) {
                                _options.clusters.addLayer(item)
                            }
                            else map.addLayer(item) 
                        }
                    } 
                    else if (start >= from && start <= to) {//if item only has a start date, display if start >= from && start <= to 
                        if (_options.clusters) {
                            _options.clusters.addLayer(item)
                        }
                        else map.addLayer(item)   
                    }  else {
                         map.addLayer(item) 
                    }     
                })
            }
        }
        else { //if ranged slider is off to == null
            while (!(key = keys.next()).done) { //for each entry in the features Map()
                if (key.value > from) break //keys are ordered, if we are already out of range just stop searching
                var arr = data.get(key.value)
                arr.forEach(function(item) {
                    var start = item.options[_options.timeAttribute]
                    var end = item.options[_options.endTimeAttribute]
                    if (_options.endTimeAttribute) {//if item has a start and end date  
                        if (from >= start && (from <= end || end === undefined)) { //ESSENTIALLY IF THE SLIDER FALLS ANYWHERE BETWEEN START AND END
                            if (_options.clusters) {
                                _options.clusters.addLayer(item)
                            }
                            else map.addLayer(item) 
                        }
                    } 
                    else if (start == from) { //if item only has a start date display if start == time   
                        if (_options.clusters) {
                            _options.clusters.addLayer(item)
                        }
                        else map.addLayer(item)  
                    }
                })
            }
        }
        if (_options.showUndefined) {
            if (_options.clusters) _options.clusters.addLayer(_options.zero_values)
            else map.addLayer(_options.zero_values)
        }
        if (_options.clusters) map.addLayer(_options.clusters)
        

        //no return val as we are directly manipulating the map?
    },

    buildMarkers: function () {
        var options =  this.options
        options.all_features.forEach(function(value,key,map) { //for each entry in the features Map()
            value.forEach(function(item) { //for each item in this array
                options.markers.push(item)
            })
        })
    },

    removeMarkers: function() {

    },
    
    setPosition: function (position) { //set the position of the slider control
        var map = this._map;
    
        if (map) {
            map.removeControl(this);
        }
    
        this.options.position = position;
    
        if (map) {
            map.addControl(this);
        }
        this.startSlider(); //call start slider function mentioned at the end of this file
        return this;
    }

});
    
L.control.sliderControl = function (options) {
    return new L.Control.SliderControl(options);
};


