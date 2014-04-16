//Seedable random function used (javascript does not supply one).
var seed = 13807;
function myRandom(){
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/*
 * Comparable Tuple Class
 *
 * The comparable tuple class holds two values and provides
 * a compare function for sorting lexicographically.
 *
 */
function ComparableTuple(a,b){
  this.first = a;
  this.second = b;
}

/*
 *
 * compare(otherTuple);
 *
 * Compares this tuple and otherTuple and returns an integer value:
 * Returns:
 *    -1: This tuple is smaller than otherTuple
 *    0: The tuples are equal
 *    1: This tuple is larger than otherTuple
 */
ComparableTuple.prototype.compare = function(o){
  if(this.first == o.first){
    if(this.second == o.second) return 0;
    else if(this.second > o.second) return 1;
    else return -1;
  }
  else{
    if(this.first > o.first) return 1;
    else return -1;
  }
}

/*
 * Camera Class
 * 
 * The camera class holds layers of drawable objects so that
 * they may be drawn one atop another onto an HTML canvas.
 *
 * Also allows panning and zooming of the layers.
 *
 */

function Camera(){
  this.zoom = 1;
  this.x = 0;
  this.y = 0;
  this.width = 900;
  this.height = 900;
  this.drawables = [];
}


Camera.prototype.draw = function(ctx){
  var that = this;
  var res = false;
  var count = this.drawables.length;
  for(var i = 0; i < count; ){
    var curDrawable = this.drawables[i];
    if(curDrawable.dirty){
      curDrawable.draw(ctx, that);
    }
    curDrawable.update();
    i++;
  }
};

Camera.prototype.addDrawable = function(d){
  this.drawables.push(d);
};

/*
 * Camera Controller Class
 *
 * This class provides an interface for the user to change the
 * camera pan and zoom with their mouse.
 *
 */

function CameraController(canv){
  this.camera = new Camera();
  this.currentlyDragging = false;
  this.curDragX = 0;
  this.curDragY = 0;
  this.canvasElement = canv;
}

CameraController.prototype.draw = function(){
  this.camera.draw(this.canvasElement.getContext("2d"));
};

CameraController.prototype.handleEvent = function(event){
  switch(event.type){
    case "mousedown":
      this.currentlyDragging = true;
      this.curDragX = event.offsetX;
      this.curDragY = event.offsetY;
      this.camera.dirty = true;
    break;
    case "mouseup":
      this.currentlyDragging = false;
      this.camera.dirty = true;
    break;
    case "mousemove":
      if(this.currentlyDragging){
        this.camera.x += this.curDragX - event.offsetX;
        this.camera.y += this.curDragY - event.offsetY;
        this.curDragX = event.offsetX;
        this.curDragY = event.offsetY;
        this.camera.dirty = true;
      }
    break;
    case "mousewheel":
    case "DOMMouseScroll":
      var oldzoom = this.camera.zoom;
      var zF = (1-event.deltaY/2000);
      this.camera.zoom *= zF;
      this.camera.dirty = true;
      event.preventDefault()
    break;
  }
};

/*
 * Point Class
 *
 * This point class holds only an x and y value,
 * represented in cartesian coordinates with the origin at
 * the top left of the screen.
 * 
 * X increases to the right. Y increases downwards.
 *
 */

function Point(x,y){
  this.x = x;
  this.y = y;
}

Point.prototype.isEqual = function(point){
  return this.x == point.x && this.y == point.y;
}

Point.prototype.toString = function(){
  return "(" + this.x + ", " + this.y + ")";
}

/*
 * World Change Class
 *
 * This class holds a matrix of change values for a given time.
 *
 * The change value is randomly set at each cell. If it is 1,
 * the cell of the world will change (toggle) when this 
 * changeset is applied.
 *
 * If it is 0, no change will occur at the cell.
 *
 */

function WorldChange(time){
  this.timeOffset = time;
  this.stateMatrix = [];
  for(var i=0; i<World.cellPerimeter; i++) {
    this.stateMatrix[i] = [];
    for(var j=0; j<World.cellPerimeter; j++) {
      var curRand = myRandom();
      if(curRand < 0.03){//3% chance to toggle the block
        this.stateMatrix[i][j] = 1;
      }
      else if(curRand < .35){//32% chance to clear the block
        this.stateMatrix[i][j] = 2;
      }
      else{//65% chance to do nothing
        this.stateMatrix[i][j] = 0;
      }
    }
  }
}


/*
 * World Class: Globals
 */

World.cellPerimeter = 60; //num of cells in grid graph square
World.cellWidth = 10; //num pixels wide for each cell at default zoom
World.numRemoves = 0; //number of priority queue removes during this cycle (for stats)

/*
 * World Class
 *
 * The world class represents a grid graph world with auxiliary
 * matrix values 
 *
 */

function World(){
  this.MODE = "LPA*";
  //modified version of Google's JavaScript Priority Queue implementation.
  this.pq = new goog.structs.PriorityQueue();
  this.rhsMatrix = []; //each entry an int
  this.gMatrix = []; //each entry an int 
  this.stateMatrix = []; //each entry an int, 0 = free, 1 = blocked.
  this.predMatrix = []; //this one is 3d, of points.
  
  for(var i=0; i<World.cellPerimeter; i++) {
      this.rhsMatrix[i] = [];
      this.gMatrix[i] = [];
      this.stateMatrix[i] = [];
      this.predMatrix[i] = [];
      for(var j=0; j<World.cellPerimeter; j++) {
          //initialize values
          this.rhsMatrix[i][j] = Number.MAX_VALUE;
          this.gMatrix[i][j] = Number.MAX_VALUE;
          this.stateMatrix[i][j] = 0;
          this.predMatrix[i][j] = [];
      }
  }


  this.worldChanges = []; //array of WorldChange objects.
  this.curWC = 0;
  this.started = 0; this.lastUpdated = 0; //Timestamp of last update.

  this.begin = new Point(1,1);
  this.finish = new Point(28,28);

  this.rhsMatrix[this.begin.y][this.begin.x] = 0;
  if(this.MODE == "LPA*"){ //LPA* uses a two value priority queue key, compared lexicographically
    this.pq.enqueue(new ComparableTuple(this.heuristic(this.begin), 0), this.begin);
  }
  else{ //Dynamic SWSF - FP, using tuple for single value for compatibility
    this.pq.enqueue(new ComparableTuple(0, 0), this.begin);
  }
  
  this.dirty = true;

  this.path = [];

}

/*
 * start()
 * Initializes the world's local variables and its begin and finish points.
 * Then computes the inital shortest path and draws it.
 *
 * Does not return a value;
 */
World.prototype.start = function(){
  this.started = Date.now();
  this.lastUpdated = this.started;
  var i = 0;
  for(i = 0; i < 1000; i++) {
    this.worldChanges.push(new WorldChange(1000 + i * 100));
  }
  /*this.worldChanges.push(new WorldChange(5000 + i * 1000));
  for(i = 16; i < 30; i++) {
    this.worldChanges.push(new WorldChange(5000 + i * 1000));
  }*/
  
  this.stateMatrix[this.begin.y][this.begin.x] = 2;
  this.stateMatrix[this.finish.y][this.finish.x] = 3;

  this.computeShortestPath();
  this.tracePath();
};

World.prototype.stop = function(){
}

World.prototype.draw = function(ctx, camera){
  ctx.fillStyle = "#AAAAAA";
  ctx.fillRect(0,0,camera.width,camera.height);
  ctx.linewidth = 1;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#000000";


  var drawMatrix = [];
  for(var i = 0; i < this.stateMatrix.length; i++){
    drawMatrix[i] = this.stateMatrix[i].slice();
  }
  
  for(var i = 0; i < this.path.length -1; i++){
    var curNode = this.path[i];
    drawMatrix[curNode.y][curNode.x] = 4;
  }

  for(var i=0; i<World.cellPerimeter; i++) {
      for(var j=0; j<World.cellPerimeter; j++) {
        switch(drawMatrix[j][i]){
          case 0:
            ctx.fillStyle = "#FFFFFF";
          break;
          case 1:
            ctx.fillStyle = "#FF0000";
          break;
          case 2:
            ctx.fillStyle = "#00FF00";
          break;
          case 3:
            ctx.fillStyle = "#AAAAFF";
          break;
          case 4:
            ctx.fillStyle = "#AAAAAA";
          break;
        }
        var realCellWidth =  Math.floor(World.cellWidth*camera.zoom);
        var xOrg = i * realCellWidth - camera.x; var yOrg = j*realCellWidth - camera.y;
        ctx.fillRect(xOrg, yOrg, realCellWidth, realCellWidth);
        ctx.strokeRect(xOrg, yOrg, realCellWidth, realCellWidth);
      }
  }
};

World.prototype.update = function(){
  var now = Date.now();
  var beenRunning = now - this.started;

  if(this.curWC < this.worldChanges.length){
    if(beenRunning >= this.worldChanges[this.curWC].timeOffset){
      this.applyWorldChange(this.worldChanges[this.curWC]);
      this.curWC++;
    }
  }
  else{
    this.lastUpdated = now;
    return true;
  }

  this.lastUpdated = now;
  return false;
};

World.prototype.computeShortestPath = function(){
  while(this.pq.peekKey().compare(this.calculateKey(this.finish)) == -1 ||
    //this.pq.peekKey() < this.calculateKey(this.finish) || 
    this.rhsMatrix[this.finish.y][this.finish.x] != this.gMatrix[this.finish.y][this.finish.x]){
    var u = this.pq.dequeue();
    World.numRemoves += 1;
    var neighbs = this.neighboringTraversableTiles(u);
    if(this.gMatrix[u.y][u.x] > this.rhsMatrix[u.y][u.x]){

      this.gMatrix[u.y][u.x] = this.rhsMatrix[u.y][u.x];
    }
    else{
      this.gMatrix[u.y][u.x] = Number.MAX_VALUE;
      this.updateVertex(u);
    }

    for(var i = 0; i < neighbs.length; i++){
      this.predMatrix[neighbs[i].y][neighbs[i].x].push(u);
      this.updateVertex(neighbs[i]);
    }
  }
}

World.prototype.updateVertex = function(point){
  if(this.stateMatrix[point.y][point.x] == 1) return;
  if(!point.isEqual(this.begin)){
    var minVal = Number.MAX_VALUE;
    var count = this.predMatrix[point.y][point.x].length;
    for(var i = 0; i < count; i++){
      var curPoint = this.predMatrix[point.y][point.x][i];
      if(this.stateMatrix[curPoint.y][curPoint.x] == 1) continue;
      if(this.gMatrix[curPoint.y][curPoint.x] + 1 < minVal){
        minVal = this.gMatrix[curPoint.y][curPoint.x] + 1;
      }
    }
    this.rhsMatrix[point.y][point.x] = minVal;
  }

  this.pq.removeObj(point);

  if(this.gMatrix[point.y][point.x] != this.rhsMatrix[point.y][point.x]) {
    this.pq.enqueue(this.calculateKey(point), point);
  }
}

World.prototype.heuristic = function(point){
  return Math.max(Math.abs(point.x-this.finish.x),Math.abs(point.y-this.finish.y));
}

World.prototype.calculateKey = function(point){
  if(this.MODE == "LPA*"){
    return new ComparableTuple(
      Math.min(this.gMatrix[point.y][point.x], this.rhsMatrix[point.y][point.x]) + this.heuristic(point),
      Math.min(this.gMatrix[point.y][point.x], this.rhsMatrix[point.y][point.x])
    );
  }
  else{ // Mode is Dynamic SWSF - FP
    return new ComparableTuple(
      Math.min(this.gMatrix[point.y][point.x], this.rhsMatrix[point.y][point.x]),
      0
    );//not required to use tuple for swsf-fp, but doing so for compatibilty.
  }
}

World.prototype.neighboringTraversableTiles = function(point){
  var ret = [];
  var n;
  n = new Point(point.x-1, point.y);
  if(this.valid(n) && this.traversable(n)) ret.push(n);
  n = new Point(point.x, point.y-1);
  if(this.valid(n) && this.traversable(n)) ret.push(n);
  n = new Point(point.x+1, point.y);
  if(this.valid(n) && this.traversable(n)) ret.push(n);
  n = new Point(point.x, point.y+1);
  if(this.valid(n) && this.traversable(n)) ret.push(n);

  return ret;
}

World.prototype.neighboringTiles = function(point){
  var ret = [];
  var n;
  n = new Point(point.x-1, point.y);
  if(this.valid(n)) ret.push(n);
  n = new Point(point.x, point.y-1);
  if(this.valid(n)) ret.push(n);
  n = new Point(point.x+1, point.y);
  if(this.valid(n)) ret.push(n);
  n = new Point(point.x, point.y+1);
  if(this.valid(n)) ret.push(n);

  return ret;
}

World.prototype.valid = function(point){
  return point.x >= 0 && point.x < World.cellPerimeter && 
  point.y >= 0 && point.y < World.cellPerimeter;
}

World.prototype.traversable = function(point){
  return this.stateMatrix[point.y][point.x] != 1;
}


World.prototype.applyWorldChange = function(wc){
  for(var i=0; i<World.cellPerimeter; i++) {
    for(var j=0; j<World.cellPerimeter; j++) {
      if(this.stateMatrix[i][j] > 1){
        continue;//special start / end blocks, skip these!
      }
      switch(wc.stateMatrix[i][j]){
        case 1://toggle this cell
          this.stateMatrix[i][j] = (this.stateMatrix[i][j] == 1) ? 0 : 1;
          break;
        case 2://clear this cell
          this.stateMatrix[i][j] = 0;
          break;
      }
    }
  }

  var startTime = window.performance.now();

  var numWorldChangeTiles = 0;

  World.numRemoves = 0;
  
  for(var i=0; i<World.cellPerimeter; i++) {
    for(var j=0; j<World.cellPerimeter; j++) {
      if(wc.stateMatrix[i][j] != 0){//we're changing at this point.
        numWorldChangeTiles++;
        var curPt = new Point(j,i);
        this. gMatrix[i][j] = Number.MAX_VALUE; 

        this.updateVertex(curPt);
        var neighbs = this.neighboringTiles(curPt);
        for(var k = 0; k < neighbs.length; k++){
          this.updateVertex(neighbs[k]);
        }
      }
    }
  }
  

  this.computeShortestPath();
  
  var endTime = window.performance.now();

  this.addResultRow([endTime-startTime, this.path.length, numWorldChangeTiles, this.pq.getCount(), World.numRemoves]);

  this.tracePath();

};

World.prototype.addResultRow = function(args){
  var tbl = document.getElementById("results");
  var row = tbl.insertRow(-1);
  for(var i = args.length-1; i >= 0; i--){
    var cur = row.insertCell();
    cur.innerHTML = args[i];
  }
}

World.prototype.tracePath = function(){
  this.path = [];
  var curPt = this.finish;
  var j = 0;
  while(!curPt.isEqual(this.begin) && j < 9999){
    j++;
    var neighbs = this.neighboringTraversableTiles(curPt);
    if(neighbs.length > 0){
      var nextPt = neighbs[0];
      var nextGVal = this.gMatrix[nextPt.y][nextPt.x];
      for(var i = 1; i < neighbs.length; i++){
        var consider = this.gMatrix[neighbs[i].y][neighbs[i].x];
        if(consider < nextGVal){
          nextPt = neighbs[i];
          nextGVal = consider;
        }
      }
      curPt = nextPt;
      if(this.path.indexOf(curPt) != -1) break;
      this.path.push(curPt);
    }
    else break;
  }
}


//Global w for our single world.
var w;

document.addEventListener('DOMContentLoaded', function(){
  var cv = document.getElementById('c');
  var cc = new CameraController(cv);
  w = new World(); 
  w.start();
  document.title = w.MODE;//Set the webpage title so I'm sure what mode I'm dealing with.

  cv.width = cc.camera.width; cv.height = cc.camera.height;
  cc.camera.addDrawable(w);
  
  cv.addEventListener('mousedown', cc, false);
  cv.addEventListener('mouseup', cc, false);
  cv.addEventListener('mousemove', cc, false);
  cv.addEventListener('mousewheel', cc, false);
  cv.addEventListener('DOMMouseScroll', cc, false);
  
  var ctx = cv.getContext("2d");
  
  //Tell the camera controller to draw, and then pass this draw()
  //function to the browser to call on next draw frame.
  (function draw(){
    cc.draw();
    requestAnimationFrame(draw);
  })();
});
