window.addEventListener("load", function(){
    let new_btn = document.createElement("button");
    new_btn.setAttribute("class", "btn btn-lg btn-darken btn-primary");
    new_btn.setAttribute("id", "btn-begin-bot");
    new_btn.innerText = "Start Bot";
    document.querySelector("#splash-options").appendChild(new_btn);
    new_btn.addEventListener("click", function(){
        if(window.aimbot_var.data.spectate_window){
            window.aimbot_var.data.spectate_window.close();
            window.aimbot_var.data.spectate_window = null;
            this.innerText = "Start Bot";
        }
        else{
            window.aimbot_var.data.spectate_window = open("https://suroi.io/", false, "width=100,height=100,popup=true");
            this.innerText = "Stop Bot";
            window.aimbot_var.data.spectatebot = true;
        }
    });
    document.querySelector("#btn-play-solo").addEventListener("click", function(){
        window.aimbot_var.data.spectate_window.document.querySelector("#btn-play-solo").click();
    });
});

window.addEventListener("beforeunload", function(){
    window.aimbot_var.data.spectate_window.close();
})

Object.assign(exports, {
    loop: function(){
        try{
            if(window.aimbot_var.game.gameOver && !window.aimbot_var.data.spectatebot){
                window.aimbot_var.data.spectate_window.location.reload();
            }
            if(window.aimbot_var.data.spectate_window.aimbot_var.game.activePlayer.dead){
                window.aimbot_var.data.spectate_window.document.querySelector("#btn-spectate").click();
            }
        } catch(e){}
    }
})