function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function toDegrees (angle) {
  return angle * (180 / Math.PI);
}


function toRadians (angle) {
  return angle * (Math.PI / 180);
}


function Post(postObj, x, y) {
    var POST_COLOR = "#263550";
    var TAG_COLOR = "#94c3ec";

    this.id = postObj.id;
    this.tags = postObj.tags || [];
    
    this.parentConnection = null;
    this.connections = [];

    this.x = x;
    this.y = y;
    this.radius = this.tags.length > 5 ? this.tags.length : 5;
    this.tagRadius = parseInt(this.radius / 2) || 1;
    this.tagDistanceFromCenter = this.radius * 4;

    this.getRootConnection = function() {
        if (this.parentConnection == null)
            return this;
        return this.parentConnection.getRootConnection();
    };

    this.addConnection = function(post) {
        var root1 = this.getRootConnection();
        var root2 = post.getRootConnection();
        if (root1 != root2) {
            root2.parentConnection = root1;
        }
    };

    this.getArea = function() {
        var xArea = this.radius, yArea = this.radius;
        var tagLength = this.tags;
        var minX, maxX, minY, maxY;
        var x = this.x, y = this.y;
        var radius = this.radius;
        var externalRadius = this.tagDistanceFromCenter + this.tagRadius;
        minX = x - radius;
        maxX = x + radius;
        minY = y - radius;
        maxY = y + radius;
        if (tagLength >= 3) {
            minX = x - externalRadius;
            maxX = x + externalRadius;
            minY = y - externalRadius;
            maxY = y + externalRadius;
        } else if (tagLength == 2) {
            minX = x - externalRadius;
            maxX = x + externalRadius;
        } else if (tagLength == 1) {
            maxX = x + externalRadius; 
        }

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
        };
    };

    this.containsCoordinates = function(x, y) {
        var area = this.getArea();
        if (x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY)
            return true;
        return false;
    };

    this._drawTags = function(ctx) {
        var tags = this.tags;
        if (this.tags.length == 0)
            return;
        var tagDegree = parseInt(360 / tags.length);
        var distanceFromCenter = this.tagDistanceFromCenter;
        var tag;
        var alpha = 0; // Degree position around the center 
        var tagX, tagY, relAlpha, beta, gamma = 90, count = 0;
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

            tagX += this.x;
            tagY += this.y;
            ctx.beginPath();
            ctx.arc(tagX, tagY, this.tagRadius, 0, 2 * Math.PI);
            ctx.fillStyle = TAG_COLOR;
            ctx.fill();
            ctx.closePath();
            alpha += tagDegree;
            count++;
        }
    };

    this.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = POST_COLOR;
        ctx.fill();
        ctx.lineWidth = this.radius / 2;
        ctx.strokeStyle = TAG_COLOR;
        ctx.stroke();
        ctx.closePath();
        this._drawTags(ctx);
    };
}

function PostLayer(cnvId) {
    var RELATIONSHIPS_LINKS_COLOR = "#3a4652";
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas = document.getElementById(cnvId);
    this.ctx = null;
    // Post list
    this.posts = [];
    // Tag dictionary
    this.tagDict = {};
    // keeps the keys of the existing relationships
    this.existingRelationships = [];

    // Private (reference) variables --->
    this._draggedPost = null;
    this._positionTreeRoot;
    this._isMouseDragging = false;
    // <--- Private (reference) variables

    this.init = function() {
        var canvas = this.canvas;
        canvas.width = this.width;
        canvas.height = this.height;
        var objContext = this;
        canvas.addEventListener(
            'mousemove',
            function(e) { objContext.mouseMove(e, objContext);},
            false
        );
        canvas.addEventListener(
            'mousedown',
            function(e) { objContext.mouseDown(e, objContext);},
            false
        );
        canvas.addEventListener(
            'mouseup',
            function(e) { objContext.mouseUp(e, objContext);},
            false
        );
        this.ctx = canvas.getContext('2d');
    }

    // Operations --->
    this._getPostByCoordinates = function(node, x, y) {
        if (node == null)
            return node;
        var post = node.post
        if (post.containsCoordinates(x, y))
            return node.post;
        else if (post.x > x)
            return this._getPostByCoordinates(node.left, x, y);
        return this._getPostByCoordinates(node.right, x, y);
    };

    this._addNodeToPositionTree = function(post) {
        var node = {
            post: post,
            left: null,
            right: null
        };
        var root = this._positionTreeRoot;
        if (root == null)
            this._positionTreeRoot = node;
        else {
            while(true) {
                if (node.post.x > root.post.x) {
                    if (root.right != null)
                        root = root.right;
                    else {
                        root.right = node;
                        break;
                    }
                } else {
                    if (root.left != null)
                        root = root.left;
                    else {
                        root.left = node;
                        break;
                    }
                }
            }
        }
    };

    this._rebuildPositionTree = function() {
        var posts = this.posts;
        this._positionTreeRoot = null;
        for(i = 0; i < posts.length; i++)
            this._addNodeToPositionTree(posts[i]);
    };

    this.addPost = function (post) {
        this.posts.push(post);
        var tagDict = this.tagDict;
        var tags = post.tags;
        for(i = 0; i < tags.length; i++) {
            tag = tags[i].toLowerCase();
            if (!(tag in tagDict))
                tagDict[tag] = [];
            else {
                tagDict[tag][0].addConnection(post);
            }
            tagDict[tag].push(post);
        }
        this._addNodeToPositionTree(post);
    };

    this.getKeyForPosts = function(post1, post2) {
        return [post1.id, post2.id].sort().join(".");
    };
    // <--- Operations


    // Events --->
    this._getDraggedPost = function(x, y) {
        console.log(this._draggedPost);
        if (this._draggedPost == null)
            this._draggedPost = this._getPostByCoordinates(this._positionTreeRoot, x, y);
        console.log(this._draggedPost);
        return this._draggedPost;
    }

    this.mouseDown = function(e, objContext) {
        this._isMouseDragging = true;
    }

    this.mouseUp = function(e, objContext) {
        objContext._draggedPost = null;
        objContext._rebuildPositionTree();
        this._isMouseDragging = false;
    }

    this.mouseMove = function(e, objContext) {
        if (objContext._isMouseDragging) {
            var x = e.pageX, y = e.pageY;
            var post = objContext._getDraggedPost(x, y);
            if (post != null) {
                post.x = x;
                post.y = y;
            }
        }
    }
    // <--- Events


    // Visual functions --->
    this._drawRelationshipBetweenPosts = function(post1, post2) {
        var postsKey = this.getKeyForPosts(post1, post2);
        if (postsKey in this.existingRelationships)
            return;
        this.existingRelationships.push(postsKey);
        var ctx = this.ctx;
        var controlX = Math.abs((post1.x - post2.x));
        var controlY = Math.abs((post1.y - post2.y));
        ctx.beginPath();
        ctx.moveTo(post1.x, post1.y);
        //ctx.quadraticCurveTo(
        //    controlX,
        //    controlY,
        //    post2.x, 
        //    post2.y
        //);
        ctx.lineTo(post2.x, post2.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = RELATIONSHIPS_LINKS_COLOR;
        ctx.stroke();
        ctx.closePath();
    };

    this._drawRelationships = function() {
        var tagDict = this.tagDict;
        var tag, post1, post2, postList;
        for(tagKey in tagDict) {
            postList = tagDict[tagKey];
            for (i = 0; i < postList.length; i++) {
                post1 = postList[i];
                for (j = i + 1; j < postList.length; j++) {
                    post2 = postList[j];
                    this._drawRelationshipBetweenPosts(post1, post2);
                }
            }
        }
    };

    this._drawConnections = function(ctx) {
        var posts = this.posts;
        var post1, post2;
        for (i = 0; i < posts.length; i++) {
            post1 = posts[i];
            post2 = post1.getRootConnection();
            this._drawRelationshipBetweenPosts(post1, post2);
        }
    };
    
    this.clear = function() {
        var cnv = this.canvas;
        this.ctx.clearRect(0, 0, cnv.width, cnv.height);
    };

    this.draw = function() {
        this.clear();
        var ctx = this.ctx;
        this._drawConnections();
        var posts = this.posts;
        for(i in posts) {
            posts[i].draw(ctx);
        }
        //this._drawRelationships();
    }
    // <--- Visual functions

    this.init();
}

function State(cnvId) {
    this.canvas = document.getElementById(cnvId);
    this.ctx = this.canvas.getContext('2d');
    this.shapes = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.addShape = function(shape) {
        this.shapes.push(shape);
    };

    this.clear = function() {
        var cnv = this.canvas;
        this.ctx.clearRect(0, 0, cnv.width, cnv.height);
    };

    this.draw = function() {
        this.clear();
        var ctx = this.ctx;
        var shapes = this.shapes;
        for(i in shapes) {
            shapes[i].draw(ctx);
        }
    };
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


var postLayer = new PostLayer('cnv');
var tumblrPosts = tumblr_api_read.posts;

var fakePosts = [
    {'id': 'xxxxxx1', 'tags': ['foo1', 'bar1']},
    {'id': 'xxxxxx2', 'tags': ['foo1', 'bar2']},
    {'id': 'xxxxxx3', 'tags': ['foo3', 'bar3']},
    {'id': 'xxxxxx4', 'tags': ['foo', 'bar', 'pinka', 'polka', 'oh', 'tic', 'tac', 'toe', 'this', 'that', 'the']}
];

tumblrPosts = tumblrPosts.concat(fakePosts);


// areas: queue of spaces where I can put the posts.
var areas = [new Area(0, 0, postLayer.width, postLayer.height, true)];
var createdPosts = 0;
var area;

while (createdPosts < tumblrPosts.length) {
    area = areas.shift();
    postLayer.addPost(new Post(
        tumblrPosts[createdPosts], area.getCenterX(), area.getCenterY()
    ));
    areas = areas.concat(area.split());
    createdPosts++;
}



window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

(function animloop() {
    requestAnimFrame(animloop);
    postLayer.draw();
})();
