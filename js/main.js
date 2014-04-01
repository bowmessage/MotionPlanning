
// requestAnim shim layer by Paul Irish
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

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
	switch(event.type){
		case "mousedown":
			this.currentlyDragging = true;
			this.curDragX = event.pageX;
			this.curDragY = event.pageY;
			this.camera.dirty = true;
		break;
		case "mouseup":
			this.currentlyDragging = false;
			this.camera.dirty = true;
		break;
		case "mousemove":
			if(this.currentlyDragging){
				this.camera.x += this.curDragX - event.pageX;
				this.camera.y += this.curDragY - event.pageY;
				this.curDragX = event.pageX;
				this.curDragY = event.pageY;
				this.camera.dirty = true;
			}
		break;
		case "mousewheel":
		case "DOMMouseScroll":
			this.camera.zoom *= (1-event.deltaY/2000);
			this.camera.dirty = true;
			event.preventDefault();
		break;
	}
	
	//alert(event.type);
};

function Point(x,y){
	this.x = x;
	this.y = y;
}


function WorldChange(time){
	this.timeOffset = time;
	this.matrix = [];
	for(var i=0; i<World.cellPerimiter; i++) {
	    this.matrix[i] = [];
	    for(var j=0; j<World.cellPerimiter; j++) {
	        this.matrix[i][j] = (Math.random()<0.1)?1:0;//Math.floor(Math.random()*2);
	    }
	}
}

function World(){
	
	this.matrix = [];
	
	for(var i=0; i<World.cellPerimiter; i++) {
	    this.matrix[i] = [];
	    for(var j=0; j<World.cellPerimiter; j++) {
	        this.matrix[i][j] = 0;
	    }
	}

	this.worldChanges = []; //array of WorldChange objects.
	this.curWC = 0;
	
	this.started = 0;
	this.lastUpdated = 0; //Timestamp of last update.

	this.begin = new Point(2,4);
	this.finish = new Point(10,40);

  this.path = [];
  this.path.push(begin);

  this.pq = new PriorityQueue({comparator: function(a, b){return 
	
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
	
	
	this.matrix[this.begin.x][this.begin.y] = 2;
	this.matrix[this.finish.x][this.finish.y] = 3;


  if(this.MODE == "LPA*"){

  }

};

World.prototype.draw = function(ctx, camera){
	ctx.fillStyle = "#AAAAAA";
	ctx.fillRect(0,0,camera.width,camera.height);
	ctx.linewidth = 1;
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#000000";


  var drawMatrix = [];
  for(var i = 0; i < this.matrix.length; i++){
    drawMatrix[i] = this.matrix[i].slice();
  }

  console.log(this.path);
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
	    	var realCellWidth =  World.cellWidth*camera.zoom;
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

World.prototype.stepPath = function(){
  if(this.MODE == "LPA*"){
    Point cur = this.path[this.path.length-1];
    this.path.push(cur);
  }
  //this.path.push(new Point(10,10));
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
  return point.x >= 0 && point.x < this.cellWidth && point.y >= 0 && point.y < this.cellWidth;
}

World.prototype.applyWorldChange = function(wc){
	for(var i=0; i<World.cellPerimiter; i++) {
	    for(var j=0; j<World.cellPerimiter; j++) {
	    	if(this.matrix[i][j] == 0){
	    		this.matrix[i][j] = (wc.matrix[i][j] == 0) ? 0 : 1;
	    	}
	    	else if(this.matrix[i][j] == 1){
	    		this.matrix[i][j] = (wc.matrix[i][j] == 0) ? 1 : 0;
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



$(document).ready(function(){
	
	
	var cv = document.getElementById('c');

	var cc = new CameraController(cv);
	
	var w = new World(); w.start();
	
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
		requestAnimFrame(draw);
		cc.draw();
	})();	
});
