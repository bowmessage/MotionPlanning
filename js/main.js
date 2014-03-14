
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
	this.dirty = true;
}

Camera.prototype.draw = function(ctx){
	if(this.dirty){
		var that = this;
		this.drawables.forEach(function(i){
			i.draw(ctx, that);
			console.log(i);
		});
		this.dirty = false;
	}
};

Camera.prototype.addDrawable = function(d){
	this.drawables.push(d);
};

function CameraController(){
	this.camera = new Camera();
	this.currentlyDragging = false;
	this.curDragX = 0;
	this.curDragY = 0;
}

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
			this.camera.zoom *= (1+event.detail/100);
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
	        this.matrix[i][j] = Math.floor(Math.random()*2);
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
	this.finish = new Point(32,352);
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
	this.matrix[this.finish.x][this.finish.y] = 2;
};

World.prototype.draw = function(ctx, camera){
	ctx.fillStyle = "#AAAAAA";
	ctx.fillRect(0,0,camera.width,camera.height);
	ctx.linewidth = 1;
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#000000";
	for(var i=0; i<World.cellPerimiter; i++) {
	    for(var j=0; j<World.cellPerimiter; j++) {
	    	switch(this.matrix[i][j]){
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
	var ret = false;
		
	if(this.curWC < this.worldChanges.length){
		if(beenRunning >= this.worldChanges[this.curWC].timeOffset){
			this.applyWorldChange(this.worldChanges[this.curWC]);
			this.curWC++;
			ret = true;
		}
	}
	
	this.lastUpdated = now;
	return ret;
};

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



$(document).ready(function(){
	var w = new World(); w.start();
	var cc = new CameraController();
	cc.camera.addDrawable(w);
	
	var cv = document.getElementById('c'); cv.width = cc.camera.width; cv.height = cc.camera.height;
	cv.addEventListener('mousedown', cc, false);
	cv.addEventListener('mouseup', cc, false);
	cv.addEventListener('mousemove', cc, false);
	cv.addEventListener('mousewheel', cc, false);
	cv.addEventListener('DOMMouseScroll', cc, false);
	
	var ctx = cv.getContext("2d");
	
	(function draw(){
		requestAnimFrame(draw);
		cc.camera.draw(ctx);
		cc.camera.dirty = w.update();
	})();	
});