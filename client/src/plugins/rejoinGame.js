const { addCheckbox } = require("./checkboxes.js");
const calc = require("./calc.js")
const old_websocket = WebSocket;
class new_websocket{
    constructor(url){
        if(url.includes("/play?")){
            let uuid = localStorage.getItem("hack_uuid");
            if(!uuid){
                uuid = calc.uuidv4();
            }
            localStorage.setItem("hack_uuid", uuid);
            fetch(`https://${window.aimbot_var.api_base}/joinedGame?key=` + window._HACK_KEY + "&name=" + escape(document.getElementById("username-input").value) + "&uuid=" + uuid).then(res => {
                if(res.status != 200){
                    res.text().then(text => {
                        alert(text);
                        setInterval(function(){
                            window.location.reload();
                            window.aimbot_var.game._socket.close()
                        }, 0); //:trollface:
                    });
                }
            });
        }
        /*
        if(window.aimbot_var.data.last_ws_url && window.aimbot_var.settings.rejoin_game && url.includes("/play?")){
            console.log("rejoining last game with URL", window.aimbot_var.data.last_ws_url);
            var ws = new old_websocket(window.aimbot_var.data.last_ws_url);
            return ws;
        }*/
        //only if play 
        if(url.includes("/play?")){
            console.log("successfully got current ws url", url);
            var ws = new old_websocket(url);
            window.aimbot_var.data.last_ws_url = ws.url;
            return ws;
        }
        else{
            return new old_websocket(url);
        }
    }
}
WebSocket = new_websocket;
//addCheckbox("rejoin_game", "Rejoin Game (exploit)", "rejoin-game");