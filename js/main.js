
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
	this.needsRedraw = true;
	
	this.started = 0;
	this.lastUpdated = 0; //Timestamp of last update.
}

World.cellPerimiter = 50;
World.cellWidth = 10;

World.prototype.start = function(){
	this.started = Date.now();
	this.lastUpdated = this.started;
	this.worldChanges.push(new WorldChange(4000));
};

World.prototype.draw = function(ctx){
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
	    	}
	    	ctx.fillRect(i*World.cellWidth, j * World.cellWidth, World.cellWidth, World.cellWidth);
	    	ctx.strokeRect(i*World.cellWidth, j * World.cellWidth, World.cellWidth, World.cellWidth);
	    }
	}
};

World.prototype.update = function(ctx){
	var now = Date.now();
	var beenRunning = now - this.started;
	
	console.log('been runnin' + beenRunning);
	
	if(this.curWC < this.worldChanges.length){
		if(beenRunning >= this.worldChanges[this.curWC].timeOffset){
			this.applyWorldChange(this.worldChanges[this.curWC]);
			this.curWC++;
			this.needsRedraw = true;
		}
	}
	
	if(this.needsRedraw){
		this.draw(ctx);
		this.needsRedraw = false;
	}
	
	this.lastUpdated = now;
};

World.prototype.applyWorldChange = function(wc){
	//alert('wuu');
	for(var i=0; i<World.cellPerimiter; i++) {
	    for(var j=0; j<World.cellPerimiter; j++) {
	    	this.matrix[i][j] += wc.matrix[i][j];
	    }
	}
};



$(document).ready(function(){
	var w = new World(); w.start();
	
	var cv = document.getElementById('c'); cv.width = 500; cv.height = 500;
	var ctx = cv.getContext("2d");
	(function draw(){
		requestAnimFrame(draw);
		w.update(ctx);
	})();	
});