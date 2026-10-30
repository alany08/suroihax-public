const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
       addCheckbox("grenade_timer", "Grenade Timer", "grenade-timer");
    },
    loop: function(){
        try{
            if(window.aimbot_var.data.attacking && !window.aimbot_var.data.grenade_timer_started){
                if(window.aimbot_var.game.activePlayer.activeItem.itemType == 3){
                    if(window.aimbot_var.game.activePlayer.activeItem.cookable){
                        window.aimbot_var.data.grenade_timer_started = true;
                        window.aimbot_var.game.uiManager.animateAction(window.aimbot_var.game.activePlayer.activeItem.name, window.aimbot_var.game.activePlayer.activeItem.fuseTime/1000);
                        setTimeout(function(){
                            window.aimbot_var.data.grenade_timer_started = false;
                        }, window.aimbot_var.game.activePlayer.activeItem.fuseTime);
                    }
                }
            }
            if(!window.aimbot_var.data.attacking && window.aimbot_var.data.grenade_timer_started){
                window.aimbot_var.data.grenade_timer_started = false;
                window.aimbot_var.game.uiManager.cancelAction();
            }
            else if(window.aimbot_var.data.grenade_timer_started){
                document.getElementById("interact-message").style.display = "none";
            }
        } catch{}
    }
})