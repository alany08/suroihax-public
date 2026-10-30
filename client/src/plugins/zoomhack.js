function handler(scr){
    window.aimbot_var.game.camera.zoom += scr.deltaY/5
    window.aimbot_var.game.camera.zoom = window.aimbot_var.game.camera.zoom < 0 ? 1 : window.aimbot_var.game.camera.zoom;
}
document.documentElement.addEventListener("wheel", handler);