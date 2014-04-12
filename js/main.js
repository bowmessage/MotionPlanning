function Camera(){
  this.zoom = 1;
  this.x = 0;
  this.y = 0;
  this.width = 500;
  this.height = 500;
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

    /*if(curDrawable.update()){
      curDrawable.stop();
      this.drawables.splice(i,1);
      count--;
    }
    else{
      i++;
    }*/
    curDrawable.update();
    i++;
  }
};

Camera.prototype.addDrawable = function(d){
  this.drawables.push(d);
};

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

CameraController.prototype.relativeXY = function(px,py){
  //return this.canvasElement.position.x
};

CameraController.prototype.handleEvent = function(event){
  //console.log(event);
  switch(event.type){
    case "mousedown":
      this.currentlyDragging = true;
  (event);
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
      this.camera.zoom *= (1-event.deltaY/2000);
      //this.camera.width /= this.camera.zoom - oldzoom + 1;
      //this.camera.height /= this.camera.zoom - oldzoom + 1;



      //this.camera.x -= event.deltaY*event.offsetX/this.camera.width/3;
      //this.camera.y -= event.deltaY*event.offsetY/this.camera.height/3;
      this.camera.dirty = true;
      event.preventDefault()
    break;
  }
  
  //alert(event.type);
};

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


function WorldChange(time){
  this.timeOffset = time;
  this.stateMatrix = [];
  for(var i=0; i<World.cellPerimeter; i++) {
      this.stateMatrix[i] = [];
      for(var j=0; j<World.cellPerimeter; j++) {
          this.stateMatrix[i][j] = (Math.random()<0.1)?1:0;//Math.floor(Math.random()*2);
      }
  }
}

function World(){

  this.pq = new goog.structs.PriorityQueue();
  this.rhsMatrix = [];
  this.gMatrix = [];
  this.stateMatrix = [];
  this.predMatrix = []; //this one is 3d, of points.
  
  for(var i=0; i<World.cellPerimeter; i++) {
      this.rhsMatrix[i] = [];
      this.gMatrix[i] = [];
      this.stateMatrix[i] = [];
      this.predMatrix[i] = [];
      for(var j=0; j<World.cellPerimeter; j++) {
          this.rhsMatrix[i][j] = Number.MAX_VALUE;
          this.gMatrix[i][j] = Number.MAX_VALUE;
          this.stateMatrix[i][j] = 0;
          this.predMatrix[i][j] = [];
      }
  }


  this.worldChanges = []; //array of WorldChange objects.
  this.curWC = 0;
  
  this.started = 0;
  this.lastUpdated = 0; //Timestamp of last update.

  this.begin = new Point(2,4);
  this.finish = new Point(10,40);


  this.rhsMatrix[this.begin.y][this.begin.x] = 0;
  this.pq.enqueue(0, this.begin);

  
  this.dirty = true;

  this.path = [];

  this.MODE = "LPA*";
}

World.cellPerimeter = 50;
World.cellWidth = 10;

World.prototype.start = function(){
  this.started = Date.now();
  this.lastUpdated = this.started;
  this.worldChanges.push(new WorldChange(5000));
  this.worldChanges.push(new WorldChange(6000));
  this.worldChanges.push(new WorldChange(7000));
  
  
  this.stateMatrix[this.begin.x][this.begin.y] = 2;
  this.stateMatrix[this.finish.x][this.finish.y] = 3;

  this.computeShortestPath();
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
  


  //console.log(this.path);
  for(var i = 0; i < this.path.length; i++){
    var curNode = this.path[i];
    drawMatrix[curNode.x][curNode.y] = 4;
  }

  for(var i=0; i<World.cellPerimeter; i++) {
      for(var j=0; j<World.cellPerimeter; j++) {
        switch(drawMatrix[i][j]){
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

  //this.stepPath();
  //


  if(this.curWC < this.worldChanges.length){
    if(beenRunning >= this.worldChanges[this.curWC].timeOffset){
      this.applyWorldChange(this.worldChanges[this.curWC]);
      this.curWC++;

      //this.computeShortestPath();
      //this.updateChangedEdges
      //console.log('aw');
    }
  }
  else{
    this.lastUpdated = now;
    return true;
  }

  this.lastUpdated = now;
  return false;
};

/*World.prototype.stepPath = function(){
  if(this.MODE == "LPA*"){
    //Point cur = this.path[this.path.length - 1]; this.path.push(cur);
    this.pq
  }
  //this.path.push(new Point(10,10));
}*/

World.prototype.computeShortestPath = function(){
  while(this.pq.peekKey() < this.calculateKey(this.finish) || 
  this.rhsMatrix[this.finish.y][this.finish.x] != this.gMatrix[this.finish.y][this.finish.x]){
    var u = this.pq.dequeue();
    var neighbs = this.neighbors(u);
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

  this.tracePath();
}

World.prototype.updateVertex = function(point){
  //console.log(point);
  if(!point.isEqual(this.begin)){
    var minVal = Number.MAX_VALUE;
    var count = this.predMatrix[point.y][point.x].length;
    for(var i = 0; i < count; i++){
      var curPoint = this.predMatrix[point.y][point.x][i];
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

World.prototype.calculateKey = function(point){
  return Math.min(this.gMatrix[point.y][point.x], this.rhsMatrix[point.y][point.x]);
}



World.prototype.neighbors = function(point){
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

  //console.log(ret);
  return ret;
}

World.prototype.valid = function(point){
  //console.log(this.stateMatrix[point.y][point.x]);
  return point.x >= 0 && point.x < World.cellPerimeter && 
  point.y >= 0 && point.y < World.cellPerimeter
    && this.stateMatrix[point.y][point.x] != 1;
}

World.prototype.applyWorldChange = function(wc){
  for(var i=0; i<World.cellPerimeter; i++) {
    for(var j=0; j<World.cellPerimeter; j++) {
      /*var curPt = new Point(j,i);
      if(curPt.isEqual(this.begin) || curPt.isEqual(this.finish)){
        continue;
      }*/

      if(this.stateMatrix[i][j] == 0){
        this.stateMatrix[i][j] = (wc.stateMatrix[i][j] == 0) ? 0 : 1;
      }
      else if(this.stateMatrix[i][j] == 1){
        this.stateMatrix[i][j] = (wc.stateMatrix[i][j] == 0) ? 1 : 0;
      }

      if(wc.stateMatrix[i][j] == 1){//we're changing at this point.
        var curPt = new Point(j,i);

        this.updateVertex(curPt);
        var neighbs = this.neighbors(curPt);
        for(var k = 0; k < neighbs.length; k++){
          this.updateVertex(neighbs[k]);
        }
      }
    }
  }

  this.tracePath();

};

World.prototype.tracePath = function(){
  this.path = [];
  var curPt = this.finish;
  while(!curPt.isEqual(this.begin)){
    //console.log(curPt);
    var neighbs = this.neighbors(curPt);
    if(neighbs.length > 0){
      var nextPt = neighbs[0];
      var nextGVal = this.gMatrix[nextPt.y][nextPt.x];
      for(var i = 0; i < neighbs.length; i++){
        var consider = this.gMatrix[neighbs[i].y][neighbs[i].x];
        if(consider < nextGVal){
          nextPt = neighbs[i];
          nextGVal = consider;
        }
      }
      curPt = nextPt;
      if(this.path.indexOf(curPt) != -1) break;
      this.path.push(curPt);
      console.log(this.path.length);
    }
    else break;
  }
}

function StatInterface(w){
  this.world = w;
  this.dirty = true;
}

StatInterface.prototype.draw = function(ctx, camera){
  //ctx.
  //console.log(ctx);
  ctx.fillStyle = "#000000";
  ctx.fillText(40,40,'asd');
};

StatInterface.prototype.update = function(){
  this.dirty = false;
};



document.addEventListener('DOMContentLoaded', function(){
  var cv = document.getElementById('c');

  var cc = new CameraController(cv);
  
  var w = new World(); 
  w.start();
  
  var si = new StatInterface(w);
  
  cv.width = cc.camera.width; cv.height = cc.camera.height;
  cc.camera.addDrawable(w);
  cc.camera.addDrawable(si);
  
  cv.addEventListener('mousedown', cc, false);
  cv.addEventListener('mouseup', cc, false);
  cv.addEventListener('mousemove', cc, false);
  cv.addEventListener('mousewheel', cc, false);
  cv.addEventListener('DOMMouseScroll', cc, false);
  
  var ctx = cv.getContext("2d");
  
  (function draw(){
    cc.draw();
    requestAnimationFrame(draw);
  })();	
  //requestAnimationFrame(draw);
});
