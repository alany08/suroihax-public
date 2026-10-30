const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("flashlight", "Flashlight", "flashlight");
    },
    loop: function(){
        try{
            if(window.aimbot_var.settings.flashlight && window.aimbot_var.game.activePlayer.activeItem.itemType == 0){
                //we screwed it up lol
                let moving = window.aimbot_var.game.inputManager.movement.left || window.aimbot_var.game.inputManager.movement.right || window.aimbot_var.game.inputManager.movement.up || window.aimbot_var.game.inputManager.movement.down;
                const scale = window.aimbot_var.game.camera.container.localTransform.a * 20;
                let curr_rot = window.aimbot_var.game.inputManager.rotation;
                if(curr_rot < 0){
                    curr_rot += 2*Math.PI;
                }
                curr_rot = 2*Math.PI - curr_rot;
                window.aimbot_var.data.canvas_ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
                window.aimbot_var.data.canvas_ctx.beginPath();
                let guntip = [Math.round(window.innerWidth/2), Math.round(window.innerHeight/2)];
                guntip[0] = guntip[0] + Math.cos(curr_rot)*window.aimbot_var.game.activePlayer.activeItem.length*scale;
                guntip[1] = guntip[1] - Math.sin(curr_rot)*window.aimbot_var.game.activePlayer.activeItem.length*scale;
                window.aimbot_var.data.canvas_ctx.moveTo(guntip[0], guntip[1]);
                let shotspread = moving ? window.aimbot_var.game.activePlayer.activeItem.moveSpread*Math.PI/360 : window.aimbot_var.game.activePlayer.activeItem.shotSpread*Math.PI/360;
                let angle1 = -curr_rot - shotspread;
                let angle2 = -curr_rot + shotspread;
                window.aimbot_var.data.canvas_ctx.arc(guntip[0], guntip[1], window.aimbot_var.game.activePlayer.activeItem.ballistics.range * scale, angle1, angle2);
                window.aimbot_var.data.canvas_ctx.fill();
            }
            if(window.aimbot_var.settings.flashlight && window.aimbot_var.game.activePlayer.activeItem.itemType == 2){
                const scale = window.aimbot_var.game.camera.container.localTransform.a * 20;
                let activeItem = window.aimbot_var.game.activePlayer.activeItem
                let r = activeItem.radius;
                let rotation = window.aimbot_var.game.inputManager.rotation;
                if(rotation < 0){
                    rotation += Math.PI*2;
                }
                rotation = 2*Math.PI - rotation;
                let offsetX = activeItem.offset.x * Math.cos(rotation) + activeItem.offset.y * Math.sin(rotation);
                let offsetY = - activeItem.offset.x * Math.sin(rotation) + activeItem.offset.y * Math.cos(rotation);
                window.aimbot_var.data.canvas_ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
                window.aimbot_var.data.canvas_ctx.beginPath();
                let pos = [Math.round(window.innerWidth/2 + offsetX*scale), Math.round(window.innerHeight/2 + offsetY*scale)];
                window.aimbot_var.data.canvas_ctx.moveTo(pos[0], pos[1]);
                window.aimbot_var.data.canvas_ctx.arc(pos[0], pos[1], r*scale, 0, Math.PI *2);
                window.aimbot_var.data.canvas_ctx.fill();
            }
        } catch{}
    }
})