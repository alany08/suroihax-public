const { addCheckbox } = require("./checkboxes.js");
const calc = require("./calc.js");

Object.assign(exports, {
	canvas: null,
	canvasctx: null,
	draw_radius: 15, //scaled by zoom
	font_size: 2.5, //multiplied, radius is scaled too
	margin: 3,
	init: function(){
		addCheckbox("highlight_crates", "Highlight rare crates", "highlight-crates");
		this.canvas = window.aimbot_var.data.overlay_canvas;
		this.canvasctx = window.aimbot_var.data.canvas_ctx;
	},
	loop: function(){
		var current_objects = [];
		if(window.aimbot_var.settings.highlight_crates && window.aimbot_var?.game?.objects?._byCategory){
	        Array.from(window.aimbot_var.game.objects._byCategory[1]).forEach(function(obj) {
				var idString = obj.definition.idString;
	            if(
	            	[
	            		"gold_rock",
	            		"loot_barrel",
	            		"loot_tree",
	            		"airdrop_crate",
	            		"gold_airdrop_crate",
	            		"airdrop_crate_locked",
	            		"viking_chest",
	            		"river_chest",
	            		"aegis_crate",
	            		"flint_crate",
				"pan_stove"
	            	].includes(idString) &&
	            	!(obj.dead || obj.destroyed)
	            ){
	                current_objects.push(obj);
	            }
	        });
	        var scale = window.aimbot_var.game.camera.container.localTransform.a * calc.pixi_scale;
	        var cHeight = window.innerHeight;
	        var cWidth = window.innerWidth;
	    	current_objects.forEach((obj) => {
				var idString = obj.definition.idString;
		    	//draw circly circles
		    	var posOnScreen = calc.calcPosOnScreen(obj.position);
		    	this.canvasctx.beginPath();
		    	this.canvasctx.strokeStyle = this.canvasctx.fillStyle = "rgba(0, 255, 0, 0.2)";
		    	this.canvasctx.arc(posOnScreen.x, posOnScreen.y, scale * this.draw_radius, 0, 2 * Math.PI);
		    	this.canvasctx.fill();
		    	//draw text
		    	this.canvasctx.textBaseline = "middle";
				this.canvasctx.textAlign = "center";
		    	this.canvasctx.font = `${scale * this.font_size}px serif`;
		    	this.canvasctx.strokeStyle = this.canvasctx.fillStyle = "rgba(0, 0, 0, 1)";
		    	this.canvasctx.fillText(idString, posOnScreen.x, posOnScreen.y);
		    	//draw arrow to point to it
		    	if(!calc.isOnScreen(posOnScreen)){
		    		//top left corner
		    		if(posOnScreen.x < 0 && posOnScreen.y < 0){
		    			var baseline = "top";
		    			var align = "left";
		    			var x = this.margin;
		    			var y = this.margin;
		    		}
		    		//bottom right corner
		    		else if(posOnScreen.x > cWidth && posOnScreen.y > cHeight){
		    			var baseline = "bottom";
		    			var align = "right";
		    			var x = cWidth - this.margin;
		    			var y = cHeight - this.margin;
		    		}
		    		//top right corner
		    		else if(posOnScreen.x > cWidth && posOnScreen.y < 0){
		    			var baseline = "top";
		    			var align = "right";
		    			var x = cWidth - this.margin;
		    			var y = this.margin;
		    		}
		    		//bottom left
		    		else if(posOnScreen.x < 0 && posOnScreen.y > cHeight){
		    			var baseline = "bottom";
		    			var align = "left";
		    			var x = this.margin;
		    			var y = cHeight - this.margin;
		    		}
		    		else{
		    			var slope = (posOnScreen.y - cHeight/2)/(posOnScreen.x - cWidth/2);
		    			//different sides
		    			if(posOnScreen.x < 0){
		    				var align = "left";
		    				var baseline = "middle";
		    				var x = this.margin;
		    				var y = posOnScreen.y - posOnScreen.x * slope;
		    			}
		    			if(posOnScreen.x > cWidth){
		    				var align = "right";
		    				var baseline = "middle";
		    				var x = cWidth - this.margin;
		    				var y = posOnScreen.y + (posOnScreen.x - cWidth) * slope;
		    			}
		    			if(posOnScreen.y < 0){
		    				var align = "center";
		    				var baseline = "top";
		    				var x = posOnScreen.x - posOnScreen.y / slope;
		    				var y = this.margin;
		    			}
		    			if(posOnScreen.y > cHeight){
		    				var align = "center";
		    				var baseline = "bottom";
		    				var x = posOnScreen.x + (posOnScreen.y - cHeight) / slope;
		    				var y = cHeight - this.margin;
		    			}
		    		}
		    		this.canvasctx.textBaseline = baseline;
		    		this.canvasctx.textAlign = align;
		    		var textDim = this.canvasctx.measureText(idString);
		    		this.canvasctx.fillText(idString, x, y);
		    		this.canvasctx.beginPath();
		    		this.canvasctx.strokeStyle = this.canvasctx.fillStyle = "rgba(0, 255, 0, 0.2)";
		    		var boxWidth = textDim.width + this.margin*2;
		    		var boxHeight = textDim.actualBoundingBoxDescent + textDim.actualBoundingBoxAscent + this.margin*2;
		    		var boxX = align == "left" ? x - this.margin : //if align left, then set the left side to basically zero because x should be this.margin
	    				(align == "right" ? x + this.margin - boxWidth : //if align right, x = cWidth - this.margin, so add it back then move it boxWidth to the left
	    					x - boxWidth/2);
	    			var boxY = baseline == "top" ? y - this.margin : //basically zero, as prev
	    				(baseline == "bottom" ? y + this.margin - boxHeight :
	    					y - boxHeight/2); //center, refer to previous for these
		    		this.canvasctx.rect(
		    			boxX,
		    			boxY,
			    		boxWidth,
			    		boxHeight
		    		);
		    		this.canvasctx.fill();
		    	}
	    	});
	    }
	}
})
