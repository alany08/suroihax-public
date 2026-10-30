const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("switch_indicator", "Switch Delay Indicator", "switch-indicator");
    },
    block_width: 100, //pixels
    block_height: 7,
    loop: function(){
        try{
            if(window.aimbot_var.settings.switch_indicator){
                //just do index for now cuz its hard to uniquely identify guns
                if(window.aimbot_var.data.previous_slot < 0/*not set yet*/){
                    window.aimbot_var.data.previous_slot = window.aimbot_var.game.uiManager.inventory.activeWeaponIndex;
                }
                if(window.aimbot_var.data.previous_slot != window.aimbot_var.game.uiManager.inventory.activeWeaponIndex){
                    window.aimbot_var.data.last_switch_time = performance.now();
                }
                var time_elapsed = performance.now() - window.aimbot_var.data.last_switch_time;
                //the suroi devs have aids thats why its /2
                if(time_elapsed < (window.aimbot_var.game.activePlayer.activeItem.switchDelay/2 || 0 /*melee/fists*/)){
                    let block_ratio = time_elapsed/(window.aimbot_var.game.activePlayer.activeItem.switchDelay/2);
                    let width = this.block_width * block_ratio;
                    let y = window.innerHeight/2;
                    let x = window.innerWidth/2;
                    window.aimbot_var.data.canvas_ctx.fillStyle = "grey";
                    window.aimbot_var.data.canvas_ctx.beginPath();
                    window.aimbot_var.data.canvas_ctx.rect(x - this.block_width/2, y - (window.aimbot_var.game.camera.container.localTransform.a*100) + 5 /*upper left corner*/, this.block_width, this.block_height);
                    window.aimbot_var.data.canvas_ctx.fill();
                    window.aimbot_var.data.canvas_ctx.fillStyle = "white";
                    window.aimbot_var.data.canvas_ctx.beginPath();
                    window.aimbot_var.data.canvas_ctx.rect(x - this.block_width/2, y - (window.aimbot_var.game.camera.container.localTransform.a*100) + 5 /*upper left corner*/, width, this.block_height);
                    window.aimbot_var.data.canvas_ctx.fill();
                }
                window.aimbot_var.data.previous_slot = window.aimbot_var.game.uiManager.inventory.activeWeaponIndex;
            }
        } catch(e){}
    }
})