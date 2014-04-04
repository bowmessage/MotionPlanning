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
  this.drawables.forEach(function(i){
    // ///////console.log(i);
    if(i.dirty){
      i.draw(ctx, that);
      //console.log(i);
    }
    i.update();
  });
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
  console.log(event);
  switch(event.type){
    case "mousedown":
      this.currentlyDragging = true;
      console.log
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

Point.prototype.isEqual(point){
  return this.x == point.x && this.y == point.y;
}


function WorldChange(time){
  this.timeOffset = time;
  this.stateMatrix = [];
  for(var i=0; i<World.cellPerimiter; i++) {
      this.stateMatrix[i] = [];
      for(var j=0; j<World.cellPerimiter; j++) {
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
  
  for(var i=0; i<World.cellPerimiter; i++) {
      this.rhsMatrix[i] = [];
      this.gMatrix[i] = [];
      this.stateMatrix[i] = [];
      for(var j=0; j<World.cellPerimiter; j++) {
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

  this.MODE = "LPA*";
}

World.cellPerimiter = 50;
World.cellWidth = 10;

World.prototype.start = function(){
  this.started = Date.now();
  this.lastUpdated = this.started;
  this.worldChanges.push(new WorldChange(2000));
  this.worldChanges.push(new WorldChange(4000));
  this.worldChanges.push(new WorldChange(5000));
  
  
  this.stateMatrix[this.begin.x][this.begin.y] = 2;
  this.stateMatrix[this.finish.x][this.finish.y] = 3;


  if(this.MODE == "LPA*"){

    //this.pq.enqueue(
    //this.pq.queue(
  }

};

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

  for(var i=0; i<World.cellPerimiter; i++) {
      for(var j=0; j<World.cellPerimiter; j++) {
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

  this.stepPath();

  if(this.curWC < this.worldChanges.length){
    if(beenRunning >= this.worldChanges[this.curWC].timeOffset){
      this.applyWorldChange(this.worldChanges[this.curWC]);
      this.curWC++;
    }
  }
  
  this.lastUpdated = now;
};

/*World.prototype.stepPath = function(){
  if(this.MODE == "LPA*"){
    //Point cur = this.path[this.path.length - 1]; this.path.push(cur);
    this.pq
  }
  //this.path.push(new Point(10,10));
}*/

World.prototype.computeShortestPath = function(){
  while(this.pq.peekKey() < this.calcKey(this.finish) || this.rhsMatrix[this.finish.y][this.finish.x] != gMatrix[this.finish.y][this.finish.x]){
    var u = this.pq.remove();
    var neighbs = this.neighbors(u);
    if(gMatrix[u.y][u.x] > rhsMatrix[u.y][u.x]){
      gMatrix[u.y][u.x] = rhsMatrix[u.y][u.x];
    }
    else{
      gMatrix[u.y][u.x] = Number.MAX_VALUE;
      this.updateVertex(u);
    }
    for(var i = 0; i < neighbs.length; i++){
      this.updateVertex(neighbs[i]);
    }
  }
}

World.prototype.updateVertex = function(point){
  if(point != this.begin){
    rhsMatrix[point.y][point.x] = min(
}


World.prototype.heuristic = function(point){
  return Math.max(Math.abs(point.y - this.finish.y), Math.abs(point.x - this.finish.x));
}

World.prototype.neighbors = function(point){
  var ret = [];
  for(var i = -1; i <= 1; i += 2){
    for(var j = -1; j <= 1; j += 2){
      var n = new Point(point.x+i, point.y+j);
      if(this.valid(n)){
        ret.push(n);
      }
    }
  }
  return ret;
}

World.prototype.valid = function(point){
  return point.x >= 0 && point.x < this.cellPerimiter && point.y >= 0 && point.y < this.cellPerimiter;
}

World.prototype.applyWorldChange = function(wc){
  for(var i=0; i<World.cellPerimiter; i++) {
      for(var j=0; j<World.cellPerimiter; j++) {
        if(this.stateMatrix[i][j] == 0){
          this.stateMatrix[i][j] = (wc.stateMatrix[i][j] == 0) ? 0 : 1;
        }
        else if(this.stateMatrix[i][j] == 1){
          this.stateMatrix[i][j] = (wc.stateMatrix[i][j] == 0) ? 1 : 0;
        }
      }
  }
};

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
