Object.assign(exports, {
	pixi_scale: 20,
    add: function(accumulator, a){
        return accumulator + a;
    },
    mean: function(arr){
    	return arr.reduce(this.add, 0)/arr.length;
    },
    isOnScreen: function(position){
    	//position is given as on screen coords
    	if (position.x < 0) return false;
    	if (position.y < 0) return false;
    	if (position.x > window.innerWidth) return false;
    	if (position.y > window.innerHeight) return false;
    	return true;
    },
	calcPosOnScreen: function(objpos){
		try{
		    var zoom = window.aimbot_var.game.camera.container.localTransform.a //zoom
			var mypos = window.aimbot_var.game.activePlayer.position //mypos
			var dx = objpos.x - mypos.x
			var dy = objpos.y - mypos.y
			//zamn 20 is the real scalew
			var x = document.documentElement.clientWidth/2 + dx*zoom*this.pixi_scale
			var y = document.documentElement.clientHeight/2 + dy*zoom*this.pixi_scale
			return {x: Math.round(x), y: Math.round(y)}
		}
		catch{
			return{x:0,y:0}
		}
	},
	solvePositiveRoot: function(quadratic){
		var discriminant = quadratic.b**2 - 4 * quadratic.a * quadratic.c;
		if (discriminant < 0) return NaN;
		var sol1 = (-quadratic.b + Math.sqrt(discriminant))/(2*quadratic.a);
		if (sol1 > 0) return sol1;
		return (-quadratic.b - Math.sqrt(discriminant))/(2*quadratic.a);
	},
	distance: function(a, b){
	    return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
	},
	dotProduct: function(vector1, vector2) {
	  let result = 0;
	  for (let i = 0; i < vector1.length; i++) {
	    result += vector1[i] * vector2[i];
	  }
	  return result;
	},
	getAngle: function(x, y){
	    let temp = Math.atan2(y, x);
	    if(temp < 0){
	        temp = temp + 2*Math.PI
	    }
	    return temp
	},
	angleDist: function(vec1, vec2){
	    let dot = this.dotProduct(vec1, vec2);
	    //distance basically gives magnitude
	    let mag = this.distance([0, 0], vec1) * this.distance([0, 0], vec2);
	    return Math.acos(dot / mag);
	},
	clamp: function(value, min, max){
		return value < max ? value > min ? value : min : max;
	},
	uuidv4: function(){
		return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
			(+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
		);
	},
	slope: function(a, b){
		return (a[1] - b[1])/
				(a[0] - b[0]);
	},
	lineIntersectsHitbox: function(a, b, hitbox){
		const line_slope = this.slope([a.x, a.y], [b.x, b.y]);
		switch(hitbox.type){
			case(0):
				let circle_radius = hitbox.radius;
				let circle_center = hitbox.position;
				//circle
				let closest_x = (-line_slope * a.x + a.y - (circle_center.x/line_slope) - circle_center.y)/
								(-1/line_slope - line_slope);
				let largest = a.x > b.x ? a.x : b.x;
				let smallest = b.x > a.x ? a.x : b.x;
				if(
					largest < closest_x ||
					smallest > closest_x
				){
					//the line sector is too far from the circle itself
					return false;
				}
				let closest_y = line_slope * (closest_x - a.x) + a.y;
				let closest_point = [closest_x, closest_y];
				if(this.distance(closest_point, [circle_center.x, circle_center.y]) < circle_radius){
					return true;
				}
				return false;
			case(1):
				var doesIntersect = false;
				//rect
				//rectangle's horizontal faces
				var upper = a.y > b.y ? a : b;
				var lower = a.y < b.y ? a : b;
				var rightmost = a.x > b.x ? a : b;
				var leftmost = a.x < b.x ? a : b;
				[
					{
						value: hitbox.min.y,
						bound_upper: hitbox.max.x,
						bound_lower: hitbox.min.x
					},
					{
						value: hitbox.max.y,
						bound_upper: hitbox.max.x,
						bound_lower: hitbox.min.x
					}
				].forEach(function(side){
					if(doesIntersect) return;
					if(
						upper.y > side.value &&
						lower.y < side.value
					){
						var intersect_value = (side.value - upper.y) / line_slope + upper.x;
						if(
							side.bound_upper > intersect_value &&
							side.bound_lower < intersect_value
						){
							doesIntersect = true;
							return;
						}
					}
					doesIntersect = false;
				}.bind(this));
				[
					{
						value: hitbox.min.x,
						bound_upper: hitbox.max.y,
						bound_lower: hitbox.min.y
					},
					{
						value: hitbox.max.x,
						bound_upper: hitbox.max.y,
						bound_lower: hitbox.min.y
					}
				].forEach(function(side){
					if(doesIntersect) return;
					if(
						rightmost.x > side.value &&
						leftmost.x < side.value
					){
						var intersect_value = (side.value - rightmost.x) * line_slope + rightmost.y;
						if(
							side.bound_upper > intersect_value &&
							side.bound_lower < intersect_value
						){
							doesIntersect = true;
							return;
						}
					}
					doesIntersect = false;
				}.bind(this));
				return doesIntersect;
			case(2):
				//group
				var doesIntersect = false;
				hitbox.hitboxes.forEach(function(h){
					if(this.lineIntersectsHitbox(a, b, h)){
						doesIntersect = true;
						//console.log("intersects");
					}
				}.bind(this));
				//console.log(doesIntersect)
				return doesIntersect;
			case(3):
				//polygon
				return false;
				//too lazy to handle these
		}
	},
	lineOfSightDestructable: function(target){
		const destructables = [];
		Array.from(window.aimbot_var.game.objects._objects)
			.forEach(obj => {
				let actualobj = obj[1];
				if(actualobj.definition){
					if(
						!actualobj.destroyed &&
						actualobj.damageable &&
						!actualobj.dead &&
						!actualobj.definition.impenetrable &&
						actualobj.definition.health <= 300 &&
						!(
							actualobj.definition.noBulletCollisions ||
							actualobj.definition.noCollisions
						) && /*some exempt types like decals and players*/
						![2, 4, 3, 5].includes(actualobj.type)
					){
						destructables.push(actualobj);
					}
				}
			});
		var mypos = window.aimbot_var.game.activePlayer.position;
		var hasLoS = true;
		destructables.forEach(function(obstacle){
			if(!obstacle.hitbox) return;
			if(this.lineIntersectsHitbox(mypos, target, obstacle.hitbox)) hasLoS = false;
		}.bind(this));
		return hasLoS;
	},
	lineOfSightIndestructable: function(target){
		const indestructables = [];
		Array.from(window.aimbot_var.game.objects._objects)
			.forEach(obj => {
				let actualobj = obj[1];
				if(actualobj.definition){
					if(
						!actualobj.destroyed &&
						!actualobj.dead &&
						(
							actualobj.definition.indestructable ||
							actualobj.definition.impenetrable ||
							!actualobj.damageable ||
							actualobj.definition.health > 300
						) &&
						!(
							actualobj.definition.noBulletCollisions ||
							actualobj.definition.noCollisions
						) && /*some exempt types like decals and players*/
						![2, 3, 4, 5].includes(actualobj.type)
					){
						indestructables.push(actualobj);
					}
				}
				else if(actualobj.isBuilding && actualobj.definition?.wallsToDestroy == Infinity){
					//indestructables.push(actualobj);
					//needs special calcs??
				}
			});
		var mypos = window.aimbot_var.game.activePlayer.position;
		var hasLoS = true;
		indestructables.forEach(function(obstacle){
			//console.log(obstacle, mypos, target);
			if(!obstacle.hitbox) return;
			if(this.lineIntersectsHitbox(mypos, target, obstacle.hitbox)) hasLoS = false;
		}.bind(this));
		return hasLoS;
	}
})