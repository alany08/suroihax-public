const { addCheckbox } = require("./checkboxes.js");
const calc = require("./calc.js");

Object.assign(exports, {
	init: function(){
		addCheckbox("grenade_warning", "Grenade Warning", "grenade-warning");
	},
	loop: function(){
		try{
			if(window.aimbot_var.settings.grenade_warning){
				const throwables = Array.from(window.aimbot_var.game.objects._byCategory[7]);
				throwables.forEach(function(nade){
					//first uv value uniquely identifies the object
					//0.63037109375 smoke
					//0.979736328125 frag grenade
					//
					//this _definition is exported from a packet update with full data
					if(["frag_grenade", "confetti_grenade"].includes(nade._definition.idString)){
						const scale = window.aimbot_var.game.camera.container.localTransform.a * calc.pixi_scale;
						let pos = calc.calcPosOnScreen(nade.position);
						window.aimbot_var.data.canvas_ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
						window.aimbot_var.data.canvas_ctx.beginPath();
						window.aimbot_var.data.canvas_ctx.arc(pos.x, pos.y, scale*calc.pixi_scale, 0, Math.PI*2);
		                window.aimbot_var.data.canvas_ctx.fill();
					}
				});
			}
		} catch{}
	}
});