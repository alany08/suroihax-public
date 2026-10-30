update(){
if(
    (
        window.aimbot_var.data.aimbot_override.enabeled && 
        window.aimbot_var.data.aimbot_override.status
    ) || (
        (
            this.attacking ||
            window.aimbot_var.data.attacking
        ) &&
        window.aimbot_var.settings.aimbot_enabeled &&
        0 != Object.keys(window.aimbot_var.data.enemies).length &&
        (
            window.aimbot_var.data.aimbot_override.enabeled ? 
                window.aimbot_var.data.aimbot_override.status :
                true
        )
    )
){
    window.aimbot_var.data.attacking = true;
    let x = window.aimbot_var.data.fakemousepos[0];
    let y = window.aimbot_var.data.fakemousepos[1];
    this.rotation = Math.atan2(
        y-window.innerHeight/2,
        x-window.innerWidth/2
    );
    /*this function converts on screen pos to game pos*20 (pixi scale)*/
    var mouse = window.aimbot_var.game.camera.container.toLocal({x: x, y: y});
    this.distanceToMouse = Math.sqrt(
        ((mouse.x/20) - window.aimbot_var.game.activePlayer.position.x)**2 +
        ((mouse.y/20) - window.aimbot_var.game.activePlayer.position.y)**2
    ); /*20 is pixi_scale*/ /*fix this later: https://github.com/HasangerGames/suroi/blob/master/client/src/scripts/managers/inputManager.ts line 264*/ 
    /*console.log(this.distanceToMouse);*/
    this.turning = true;
    this.game.activePlayer.container.rotation = this.rotation
}
const $1={movement