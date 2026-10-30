const server_id_range = [1, 2, 3, 4, 5];

const old_websocket = WebSocket;
class new_websocket{
    constructor(url){
        var ws = new old_websocket(url);
        if(url.includes("/team?")){
            ws.addEventListener("message", (e) => {
            	let data = JSON.parse(e.data);
            	window.aimbot_var.data.team_identifier = data["teamID"];
            	console.log("got request for team, noting down team ID", data["teamID"]);
            });
        }
        return ws;
    }
}
WebSocket = new_websocket;

const dropdown = document.createElement("select");

//create the elements
const avail_games = {}
server_id_range.forEach((id) => {
	avail_games[id] = false;
	let opt = document.createElement("option");
	opt.id = `suroihax-server-select-${id}`;
	opt.disabled = "disabled";
	opt.value = id;
	opt.innerText = `Game ${id}: ${avail_games[id] ? "\u2705" : "\u274c"}`;
	dropdown.appendChild(opt);
});

dropdown.style.marginBottom = "10px";
dropdown.id = "suroihax-game-list";
dropdown.value = "1";
document.getElementById("server-select").appendChild(dropdown);

let lock = document.getElementById("locked-msg");
lock.style.transform = "translate(-50%, 50px)";

//refresh the ui we slapped on
function refresh_game_list(){
	server_id_range.forEach((id) => {
		let opt = document.getElementById(`suroihax-server-select-${id}`);
		opt.disabled = avail_games[id] ? "" : "disabeled";
		opt.innerText = `Game ${id}: ${avail_games[id] ? "\u2705" : "\u274c"}`;
	})
}

//try making a websocket with all the games
function check_all_games(){
	let in_game = false;
	try {
		in_game = window.aimbot_var.game._socket.readyState == 1;
	} catch{}
	if(!in_game){
		try {
			var region = JSON.parse(localStorage.suroi_config)["variables"]["cv_region"];
		} catch {
			region = "na"; //fallback if suroi_config is undefined
			console.warn("Failed to get region from suroi_config variables! Defaulting to NA.");
		}
		server_id_range.forEach((id) => {
			let testws = new WebSocket(`wss://${id}.${region}.suroi.io/play`);
			testws.addEventListener("open", () => {
				//console.log(region, id, "success");
				avail_games[id] = true;
				testws.close();
				refresh_game_list();
			});
			setTimeout(() => {testws.close()}, 5000); //cancel them when the next interval comes around
			//error doesn't get called when it closes after opening, only errors "page interrupted" when cancelled during connect phase
			testws.addEventListener("error", () => {
				//console.log(region, id, "failed");
				let list = document.getElementById("suroihax-game-list");
				if(parseInt(list.value) == id){
					Object.keys(avail_games).forEach((k) => {
						if(avail_games[k]){
							list.value = k;
						}
					})
				}
				avail_games[id] = false;
				refresh_game_list();
			})
		});
	}
}

document.getElementById("server-select").addEventListener("click", check_all_games);
setInterval(check_all_games, 5000);
setInterval(() => {
	try{
		window.aimbot_var.game._socket.onclose = check_all_games;
	} catch{}
}, 1000);

//monkey patch the getGame request
(function() {
    // Store the original XMLHttpRequest
    const originalXHR = XMLHttpRequest.prototype.open;

    // Override the open method
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;  // Save the request URL for later use
        //let args = arguments;
        //args[1] = "/";
        //its fine
        return originalXHR.apply(this, arguments);
    };

    // Store the original send method
    const originalSend = XMLHttpRequest.prototype.send;

    // Override the send method
    XMLHttpRequest.prototype.send = function(body) {
        // Add an event listener to intercept when the request completes
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4) { // The request is complete
                if (this._url.includes('/api/getGame')) {
                    // If the request URL matches a condition, spoof the response
                    console.log("Spoofing response, joining game,", parseInt(document.getElementById("suroihax-game-list").value))
                    Object.defineProperty(this, 'responseText', {
                        get: function() {
                            return JSON.stringify({
                            	"success": true,
                            	"gameID": parseInt(document.getElementById("suroihax-game-list").value) - 1 //different indexing
                            });
                        }
                    });
                }
            }
        });

        // Call the original send method
        return originalSend.apply(this, arguments);
    };
})();