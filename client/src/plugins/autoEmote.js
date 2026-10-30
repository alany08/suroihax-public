const { addCheckbox } = require("./checkboxes.js")
Object.assign(exports, {
	init: function(){
		addCheckbox("auto_emote", "Auto emote on kill", "autoemote");
		window.aimbot_var.data.kills = 0;
		window.aimbot_var.data.old_kills = 0;
		setInterval(function(){
			try{
				window.aimbot_var.data.old_kills = window.aimbot_var.data.kills;
				window.aimbot_var.data.kills = parseInt(document.getElementById("ui-kills").innerText);
			} catch{}
			if(window.aimbot_var.data.kills != window.aimbot_var.data.old_kills && ! window.aimbot_var.data.auto_emote_interval && window.aimbot_var.settings.auto_emote){
				window.aimbot_var.data.auto_emote_counter = 0;
				window.aimbot_var.data.auto_emote_interval = setInterval(() => {
					window.aimbot_var.data.auto_emote_counter += 1;
					window.aimbot_var.game.inputManager.actions.push({
						type: 12,
						emote: {idString: window.aimbot_var.settings.auto_emote_emote_identifier}
					});
					if(window.aimbot_var.data.auto_emote_counter >= 15){
						clearInterval(window.aimbot_var.data.auto_emote_interval);
						window.aimbot_var.data.auto_emote_interval = null;
					}
				}, 100);
			}
		}, 1000);
	}
})