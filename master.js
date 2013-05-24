var mysvg = d3.select("#mysvg")
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight);

function Tag(svg, data, x, y, radius) {
    // Constants
    var GRAPHIC_PREFIX = "POST_";
    var CSS_CLASS = "tag";
    var MOVE_TO_DURATION = 1000;
    
    // Data attributes
    this.id;
    this.label;
    this.data;

    // Graphic attributes 
    this.svg = svg;
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius > 1 ? radius : 2;
    this.circle;

    // Constructor ---->
    this._init = function(data) {
        this.id = data.id;
        this.label = data.label;
        this.data = data;
        this._appendToSVG();
    };
    // <---- Constructor

    // Graphic operations ---->
    this._getGraphicId = function() {
        return GRAPHIC_PREFIX + this.id;
    };

    this._appendToSVG = function() {
        this.circle = this.svg.append("circle")
            .attr("cx", this.x)
            .attr("cy", this.y)
            .attr("r", this.radius)
            .attr("id", this._getGraphicId())
            .attr("class", CSS_CLASS);
    };

    this.moveTo = function(x, y, animated) {
        animated = animated || false;
        this.x = x;
        this.y = y;
        var circle = this.circle;
        if (animated) {
            circle = circle.transition().duration(MOVE_TO_DURATION);
        }
        circle.attr("cx", x)
            .attr("cy", y);
        return this;
    };

    this.beat = function() {
        var circle = this.circle;
        // TODO: find/develop and beat algorithm.
        return this;
    };

    // <---- Graphic operations
    this._init(data);
}

function DataObject(svg, data, x, y) {
    // Constants
    var GRAPHIC_PREFIX = "POST_";
    var CSS_CLASS = "post";
    var MOVE_TO_DURATION = 1000;

    // Data attributes
    this.id;
    this.label;
    this.tags;
    this.data;

    // Graphic attributes
    this.svg = svg;
    this.x = x || 0;
    this.y = y || 0;
    this.radius;
    this.relationRadius;
    this.circle;
    this.relationCircle;

    // Constructor ---->
    this._init = function(data) {
        this.id = data.id;
        this.label = data.label;
        this.tags = [];
        var tagLength = data.tags.length;
        this.radius = tagLength > 5 ? tagLength * 2 : 10;
        this.relationRadius = this.radius * 3;
        this.data = data;
        this._appendToSVG();
        this._appendTags(data.tags);
        this._setupEvents();
    };
    // <---- Constructor

    // Events --->
    this._setupEvents = function() {
        var circle = this.circle;
        var objContext = this;
        circle.call(d3.behavior.drag()
            .on("drag", function() {
                objContext.onDrag(objContext);
            })
        );
        circle.on(
            "click",
            function() {
                objContext.onClick(objContext);
            },
            false
        );
    };

    this.onDrag = function(objContext) {
        objContext.moveTo(d3.event.x, d3.event.y);
    };

    this.onClick = function(objContext) {
        objContext.beat();
    };
    // <---- Events

    // Graphic operations ---->
    this._getGraphicId = function() {
        return GRAPHIC_PREFIX + this.id;
    };

    this._appendTags = function(tags) {
        this.tags = [];
        if (tags.length == 0)
            return;
        var tagDegree = parseInt(360 / tags.length);
        var distanceFromCenter = this.radius * 2;
        var tag;
        var alpha = 0; // Degree position around the center 
        var dataX = this.x;
        var dataY = this.y;
        var tagX, tagY, relAlpha, beta, gamma = 90;
        for (i in tags) {
            tag = tags[i];
            if (alpha <= 90)
                relAlpha = alpha;
            else if (alpha <= 180)
                relAlpha = 180 - alpha;
            else if (alpha <= 270)
                relAlpha = 90 - (270 - alpha);
            else
                relAlpha = 360 - alpha;

            beta = 180 - gamma - relAlpha;
            if (relAlpha == 0)
                tagX = distanceFromCenter;
            else
                tagX = distanceFromCenter * Math.sin(toRadians(beta))  / Math.sin(toRadians(gamma));
            if (relAlpha == 90)
                tagY = distanceFromCenter;
            else
                tagY = distanceFromCenter * Math.sin(toRadians(relAlpha)) / Math.sin(toRadians(gamma));

            if (alpha > 90 && alpha < 270)
                tagX = -tagX;
            if (alpha <= 180)
                tagY = -tagY;
            
            tagX += dataX;
            tagY += dataY;
            this.tags.push(new Tag(
                this.svg,
                {id: this.id + tag, label: tag},
                tagX,
                tagY,
                this.radius / 4
            ));
            alpha += tagDegree;
        }
    };

    this._appendToSVG = function() {
        this.circle = this.svg.append("circle")
            .attr("cx", this.x)
            .attr("cy", this.y)
            .attr("r", this.radius)
            .attr("id", this._getGraphicId())
            .attr("class", CSS_CLASS);
    };

    this.drawRelationCircle = function() {
        if (this.relationCircle == null) {
            this.relationCircle = this.svg.append("circle")
                .attr("cx", this.x)
                .attr("cy", this.y)
                .attr("r", this.relationRadius)
                .attr("class", "relationship");
        }
        return this;
    };

    this.moveTo = function(x, y, animated) {
        animated = animated || false;
        var circle = this.circle;
        if (animated){
            circle = circle.transition()
                .duration(MOVE_TO_DURATION);
        }
        circle.attr("cx", x).attr("cy", y);
        var dx, dy; 
        var tags = this.tags;
        var tag;
        for (i in tags) {
            tag = tags[i];
            dx = this.x - tag.x;
            dy = this.y - tag.y;
            tag.moveTo(
                x + dx,
                y + dy,
                animated
            );
        }
        this.x = x;
        this.y = y;
        return this;
    };

    this.beat = function() {
        var circle = this.circle;
        var inc = -2, delay = 0;
        var tags = this.tags;
        for (i = 0; i < 4; i++){
            circle.transition(50 * (i + 1))
                .delay(delay)
                .attr("r", this.radius + inc);
            inc *= -1;
            delay += 50 * (i + 1);
        }
        for(i in tags) {
            tags[i].beat();
        }
        circle.transition()
            .duration(500)
            .delay(delay)
            .attr("r", this.radius);
        return this;
    };
    // <---- Graphic operations

    this._init(data);
}


function DataLayer(svg) {

    // Data Attributes
    this.dataObjects = [];
    this.tagIndex = {};

    // Graphic attributes
    this.svg = svg;

    // Constructor ---->
    this._init = function() {};
    // <---- Constructor

    // Operations ---->
    this.addDataObject = function(dataObject) {
        this.dataObjects.push(dataObject);
        var tagLabel;
        var tagIndex = this.tagIndex;
        for (i = 0; i < dataObject.tags.length; i++) {
            tagLabel = dataObject.tags[i].label;
            if (!(tagLabel in tagIndex)) {
                tagIndex[tagLabel] = [];
            }
            tagIndex[tagLabel].push(dataObject);
        }
        return this;
    };
    // <---- Operations

    // Graphic operations ---->
    this._drawRelationshipBetweenObjects = function(dataObj1, dataObj2) {
        dataObj1.drawRelationCircle();
        dataObj2.drawRelationCircle();
        var x1, x2, y1, y2;
        x1 = dataObj1.x;
        y1 = dataObj1.y;
        x2 = dataObj2.x;
        y2 = dataObj2.y;

        if (x1 == x2) {
            // infinite slope
            if (y1 < y2) {
                y1 = dataObj1.y + dataObj1.relationRadius;
                y2 = dataObj2.y - dataObj2.relationRadius;
            } else if (y1 > y2){
                y1 = dataObj1.y - dataObj1.relationRadius;
                y2 = dataObj2.y + dataObj2.relationRadius;
            }
        } else if (y1 == y2) {
            // slope = 0
            if (x1 < x2) {
                x1 = dataObj1.x + dataObj1.relationRadius;
                x2 = dataObj2.x - dataObj2.relationRadius;
            } else if (x1 > x2){
                x1 = dataObj1.x - dataObj1.relationRadius;
                x2 = dataObj2.x + dataObj2.relationRadius;
            }
        } else {
            var slope = (y2 - y1) / (x2 - x1);
            var alpha = Math.atan(slope);

            diffY1 = Math.abs(dataObj1.relationRadius * Math.sin(alpha) / Math.sin(90));
            diffX1 = Math.sqrt(Math.pow(dataObj1.relationRadius, 2) - Math.pow(diffY1, 2));

            diffY2 = Math.abs(dataObj2.relationRadius * Math.sin(alpha) / Math.sin(90));
            diffX2 = Math.sqrt(Math.pow(dataObj2.relationRadius, 2) - Math.pow(diffY2, 2));


            console.log("1 r: " + dataObj1.relationRadius + " diffX: " + diffX1 + " " + diffY1 + " x: " + x1 + " y: " + y1); 
            console.log("2 r: " + dataObj2.relationRadius + " diffX: " + diffX2 + " " + diffY2 + " x: " + x2 + " y: " + y2); 

            if (x1 < x2) {
                x1 += diffX1;
                x2 -= diffX2;
            } else {
                x1 -= diffX1;
                x2 += diffX2;
            }

            if (y1 < y2) {
                y1 += diffY1;
                y2 -= diffY2;
            } else {
                y1 -= diffY1;
                y2 += diffY2;
            }

        }

        this.svg.append('line')
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('class', 'relationship');
    };

    this.drawRelationships = function() {
        var tagIndex = this.tagIndex;
        var dataObjects = this.dataObjects;
        var tagLabel;
        var dataObj1, dataObj2;
        for (i in dataObjects) {
            dataObj1 = dataObjects[i];
            for (j in dataObj1.tags) {
                tagLabel = dataObj1.tags[j].label;
                tagDataObject = tagIndex[tagLabel];
                for (k in tagDataObject) {
                    dataObj2 = tagDataObject[k];
                    if (dataObj1 == dataObj2)
                        continue;
                    this._drawRelationshipBetweenObjects(dataObj1, dataObj2);
                }
                break;
            }
            break;
        }
        
    };
    // <---- Graphic operations

    this._init();
}


function Area(x0, y0, x1, y1, verticalSplit) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.verticalSplit = verticalSplit; // vertical split?

    this.getCenterX = function() {
        return this.x0 + (this.x1 - this.x0) / 2;
    };

    this.getCenterY = function() {
        return this.y0 + (this.y1 - this.y0) / 2;
    };

    this.split = function() {
        var area1, area2;
        var isVertical = this.verticalSplit;
        if (isVertical) {
            var centerX = this.getCenterX();
            area1 = new Area(this.x0, this.y0, centerX, this.y1, !isVertical);
            area2 = new Area(centerX, this.y0, this.x1, this.y1, !isVertical);
        } else {
            var centerY = this.getCenterY();
            area1 = new Area(this.x0, this.y0, this.x1, centerY, !isVertical);
            area2 = new Area(this.x0, centerY, this.x1, this.y1, !isVertical);
        }
        return [area1, area2];
    };
}


var x0 = 0, y0 = 0;
var svgWidth = parseInt(mysvg.attr("width"));
var svgHeight = parseInt(mysvg.attr("height"));

// areas: queue of spaces where I can put the posts.
var areas = [new Area(0, 0, svgWidth, svgHeight, true)];
var createdPosts = 0;
var area;
var dataLayer = new DataLayer(mysvg);
var dataObject;


var data = [
    {id: "xxx-1", label: "foo 1", tags: ['python', 'django', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']},
    {id: "xxx-2", label: "foo 1", tags: ['javascript', 'jquery', 'd3.js']},
    {id: "xxx-3", label: "foo 1", tags: ['python', 'django', 'haystack']},
    {id: "xxx-4", label: "foo 1", tags: ['python', 'pyramind']},
    {id: "xxx-5", label: "foo 1", tags: ['python', 'flask', 'jinja2']},
    {id: "xxx-6", label: "foo 1", tags: ['python', 'django', 'jinja2']},
    {id: "xxx-7", label: "foo 1", tags: ['search', 'lucene']},
    {id: "xxx-8", label: "foo 1", tags: ['python', 'pylucene', 'lucene', 'search']},
    {id: "xxx-9", label: "foo 1", tags: ['python', 'pysolr', 'solr', 'search']},
    {id: "xxx-10", label: "foo 1", tags: ['javascript', 'jquery']},
    {id: "xxx-11", label: "foo 1", tags: ['javascript', 'jquery']},
    {id: "xxx-12", label: "foo 1", tags: ['javascript', 'html5', 'canvas']},
    {id: "xxx-13", label: "foo 1", tags: ['html5', 'svg', 'javascript', 'd3']},
    {id: "xxx-14", label: "foo 1", tags: ['html5']},
    {id: "xxx-15", label: "foo 1", tags: ['scala']},
    {id: "xxx-16", label: "foo 1", tags: ['java',]},
    {id: "xxx-17", label: "foo 1", tags: ['java', 'scala']},
    {id: "xxx-18", label: "foo 1", tags: ['clojure']},
    {id: "xxx-19", label: "foo 1", tags: ['java', 'clojure']},
    {id: "xxx-20", label: "foo 1", tags: ['arduino']},
    {id: "xxx-21", label: "foo 1", tags: ['arduino']},
    {id: "xxx-22", label: "foo 1", tags: ['raspberry pi']},
    {id: "xxx-23", label: "foo 1", tags: ['raspberry pi', 'python']},
    {id: "xxx-24", label: "foo 1", tags: ['raspberry pi', 'arduino']},
    {id: "xxx-25", label: "foo 1", tags: ['arduino']},
    {id: "xxx-26", label: "foo 1", tags: ['python', 'django']},
    {id: "xxx-27", label: "foo 1", tags: ['python', 'django', 'filebrowser']},
    {id: "xxx-28", label: "foo 1", tags: ['ruby', 'rails']},
    {id: "xxx-29", label: "foo 1", tags: ['search', 'solr']},
    {id: "xxx-30", label: "foo 1", tags: ['database', 'mongodb']},
    {id: "xxx-31", label: "foo 1", tags: ['database', 'redis']},
    {id: "xxx-32", label: "foo 1", tags: ['python']},
    {id: "xxx-33", label: "foo 1", tags: ['python', 'pyit']},
    {id: "xxx-34", label: "foo 1", tags: ['database', 'redis']},
    {id: "xxx-35", label: "foo 1", tags: ['database', 'cassandra']},
    {id: "xxx-36", label: "foo 1", tags: ['database', 'bigtable', 'google']},
    {id: "xxx-37", label: "foo 1", tags: ['python', 'django']},
    {id: "xxx-38", label: "foo 1", tags: ['javascript', 'jquery', 'd3.js']},
    {id: "xxx-39", label: "foo 1", tags: ['python', 'django', 'haystack']},
    {id: "xxx-40", label: "foo 1", tags: ['python', 'pyramind']},
    {id: "xxx-41", label: "foo 1", tags: ['python', 'flask', 'jinja2']},
    {id: "xxx-42", label: "foo 1", tags: ['python', 'django', 'jinja2']},
    {id: "xxx-43", label: "foo 1", tags: ['search', 'lucene']},
    {id: "xxx-44", label: "foo 1", tags: ['python', 'pylucene', 'lucene', 'search']},
    {id: "xxx-45", label: "foo 1", tags: ['python', 'pysolr', 'solr', 'search']},
    {id: "xxx-46", label: "foo 1", tags: ['javascript', 'jquery']},
    {id: "xxx-47", label: "foo 1", tags: ['javascript', 'jquery']},
    {id: "xxx-48", label: "foo 1", tags: ['javascript', 'html5', 'canvas']},
    {id: "xxx-49", label: "foo 1", tags: ['html5', 'svg', 'javascript', 'd3']},
    {id: "xxx-50", label: "foo 1", tags: ['html5']},
    {id: "xxx-51", label: "foo 1", tags: ['scala']},
    {id: "xxx-52", label: "foo 1", tags: ['java',]},
    {id: "xxx-53", label: "foo 1", tags: ['java', 'scala']},
    {id: "xxx-54", label: "foo 1", tags: ['clojure']},
    {id: "xxx-55", label: "foo 1", tags: ['java', 'clojure']},
    {id: "xxx-56", label: "foo 1", tags: ['arduino']},
    {id: "xxx-57", label: "foo 1", tags: ['arduino']},
    {id: "xxx-58", label: "foo 1", tags: ['raspberry pi']},
    {id: "xxx-59", label: "foo 1", tags: ['raspberry pi', 'python']},
    {id: "xxx-60", label: "foo 1", tags: ['raspberry pi', 'arduino']},
    {id: "xxx-61", label: "foo 1", tags: ['arduino']},
    {id: "xxx-62", label: "foo 1", tags: ['python', 'django']},
    {id: "xxx-63", label: "foo 1", tags: ['python', 'django', 'filebrowser']},
    {id: "xxx-64", label: "foo 1", tags: ['ruby', 'rails']},
    {id: "xxx-65", label: "foo 1", tags: ['search', 'solr']},
    {id: "xxx-66", label: "foo 1", tags: ['database', 'mongodb']},
    {id: "xxx-67", label: "foo 1", tags: ['database', 'redis']},
    {id: "xxx-68", label: "foo 1", tags: ['python']},
    {id: "xxx-69", label: "foo 1", tags: ['python', 'pyit']},
    {id: "xxx-70", label: "foo 1", tags: ['database', 'redis']},
    {id: "xxx-71", label: "foo 1", tags: ['database', 'cassandra']},
    {id: "xxx-72", label: "foo 1", tags: ['database', 'bigtable', 'google']}

];


while (createdPosts < data.length) {
    area = areas.shift();
    dataObject = new DataObject(mysvg, data[createdPosts], x0, y0).moveTo(
        area.getCenterX(),
        area.getCenterY(),
        true
    );
    dataLayer.addDataObject(dataObject);
    areas = areas.concat(area.split());
    createdPosts++;
    if (x0 == 0 && y0 == 0)
        y0 = svgHeight;
    else if (x0 == 0)
        x0 = svgWidth;
    else if (x0 == svgWidth && y0 == svgHeight)
        y0 = 0;
    else {
        x0 = 0;
        y0 = 0;
    }
}
dataLayer.drawRelationships();

