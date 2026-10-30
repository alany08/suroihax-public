const { addCheckbox } = require("./checkboxes.js");

addCheckbox("same_game_chat", "Chat only same game", "same-game-chat");

function addMsg(jsondata){
    if(window.aimbot_var.settings.same_game_chat){
        if(jsondata.gameid == window.aimbot_var.data.last_ws_url.split("gameID=")[1].split("&")[0] &&
            jsondata.region == window.aimbot_var.data.last_ws_url.split("wss://")[1].split("/play?")[0]){
            var curr_msgs = document.querySelectorAll("#messages-container > .chat-message");
            if(curr_msgs.length > 30){
                curr_msgs[0].remove();
            }
            let new_msg = document.createElement("span");
            new_msg.style.display = "block";
            let bold = document.createElement("b");
            bold.innerText = jsondata.user;
            new_msg.appendChild(bold);
            new_msg.appendChild(
                document.createTextNode(": " + jsondata.content)
            );
            new_msg.setAttribute("class", "chat-message");
            new_msg.style.fontSize = "14px";
            document.querySelector("#messages-container").appendChild(new_msg);
            new_msg.style.transitionDuration = "0.25s";
            new_msg.style.backgroundColor = "yellow";
            setTimeout(function(){
                new_msg.style.transitionDuration = "0.25s";
                new_msg.style.backgroundColor = "";
            }.bind(this), 1000);
            new_msg.scrollIntoView();
            setTimeout(function(){
                new_msg.remove();
            }.bind(this), 60000);
        }
    }
    else{
        var curr_msgs = document.querySelectorAll("#messages-container > .chat-message");
        if(curr_msgs.length > 30){
            curr_msgs[0].remove();
        }
        let new_msg = document.createElement("span");
        new_msg.style.display = "block";
        let bold = document.createElement("b");
        bold.innerText = jsondata.user + " (" + jsondata.region.split(".")[0].toUpperCase() + " " + jsondata.gameid + ")";
        new_msg.appendChild(bold);
        new_msg.appendChild(
            document.createTextNode(": " + jsondata.content)
        );
        new_msg.setAttribute("class", "chat-message");
        new_msg.style.fontSize = "14px";
        document.querySelector("#messages-container").appendChild(new_msg);
        new_msg.style.transitionDuration = "0.25s";
        new_msg.style.backgroundColor = "#bac206";
        setTimeout(function(){
            new_msg.style.transitionDuration = "0.25s";
            new_msg.style.backgroundColor = "";
        }.bind(this), 100);
        new_msg.scrollIntoView();
        setTimeout(function(){
            new_msg.remove();
        }.bind(this), 60000);
    }
}

function sendMsg(msg){
    try{
        window.aimbot_var.data.chat_socket.send(JSON.stringify({
            user: document.getElementById("username-input").value,
            content: msg.replaceAll("\n", ""),
            gameid: window.aimbot_var.data.last_ws_url.split("wss://")[1].split(".")[0],
            region: window.aimbot_var.data.last_ws_url.split("wss://")[1].split(".").slice(1).join(".").split("/")[0],
            hack_key: window._HACK_KEY
        }));
    }
    catch{
        window.aimbot_var.data.chat_socket.send(JSON.stringify({
            user: document.getElementById("username-input").value,
            content: msg.replaceAll("\n", ""),
            gameid: "-1",
            region: "Loading",
            hack_key: window._HACK_KEY
        }));
    }
}

setInterval(function(){
    if(!window.aimbot_var.data.chat_socket){
        console.log("Chat socket not open, connecting...");
        window.aimbot_var.data.chat_socket = new WebSocket(`wss://${window.aimbot_var.api_base}/chat`);
        window.aimbot_var.data.chat_socket.addEventListener("open", function(evt){
            sendMsg("Connected to SUROIHAX (AUTOMATED)");
        });
        window.aimbot_var.data.chat_socket.addEventListener("close", function(evt){
            window.aimbot_var.data.chat_socket = null;
        });
        window.aimbot_var.data.chat_socket.addEventListener("message", function(msg){
            if (msg.data == "ping") return;
            try{
                addMsg(JSON.parse(msg.data));
            } catch(e){console.log(e)}
        });
    }
}, 1000);

function ping_server(){
    window.aimbot_var.data.chat_socket.send("ping");
}

setInterval(ping_server, 10000); //keep the socket alive

function addChatUi(){
    let chat_container = document.createElement("div");
    chat_container.style.zIndex = "99999999";
    chat_container.style.position = "absolute";
    chat_container.style.right = (document.querySelector("#weapons-container").getBoundingClientRect().width + 20).toString() + "px";
    chat_container.style.bottom = "10px";
    chat_container.id = "chat-container";
    chat_container.innerHTML = `
    <div id="messages-container"></div>
    <textarea placeholder="[Enter] Send a message" id="chat-textbox" rows="1" cols="35" maxlength="64"></textarea>
    <style>
        #chat-textbox{
            font-size: 14px;
            resize: none;
            overflow: hidden;
            background: transparent;
            border: none;
            color: white;
            background-color: rgba(0,0,0,0.4);
            margin: 3x;
        }
        #messages-container{
            max-height: 150px;
            overflow: auto;
            scrollbar-width: thin;
        }
        #messages-container::-webkit-scrollbar-track{
            opacity 0%;
        }
        #messages-container::-webkit-scrollbar-thumb {
            background: grey;
            opacity: 60%
            border-radius: 10px;
        }
        #chat-textbox::placeholder{
            color: white;
        }
        #chat-container{
            overflow-wrap: break-word;
            padding: 10px;
            background-color: rgba(0,0,0,0.4);
            pointer-events: none;
        }
        .chat-message{
            margin: 3px;
        }
        body{
            overflow: hidden;
        }
    </style>
    `;
    document.body.appendChild(chat_container);
    document.querySelector("#chat-textbox").addEventListener("keydown", function(e){
        this.value = this.value.replaceAll("\n", "");
        if(e.key == "Enter"){
            if(this.value){
                try{
                    sendMsg(this.value);
                } catch{}
            }
            this.blur();
            document.querySelector("#game-ui").focus(); 
            this.value = "";
            e.preventDefault();
        }
        if(e.key == "Escape"){
            this.blur();
            document.querySelector("#game-ui").focus(); 
        }
        e.stopPropagation();
    });
    document.querySelector("#messages-container").style.maxWidth = document.querySelector("#chat-textbox").getBoundingClientRect().width.toString() + "px";
    chat_container.addEventListener("wheel", function(e){
        e.stopPropagation();
    });
};

window.addEventListener("keydown", function(e){
    if(e.key == "Enter"){
        document.querySelector("#chat-textbox").focus();
        window.aimbot_var.game.inputManager.movement.left = 
            window.aimbot_var.game.inputManager.movement.right = 
            window.aimbot_var.game.inputManager.movement.up = 
            window.aimbot_var.game.inputManager.movement.down = false;
        e.preventDefault();
    }
});

var tmp_int = setInterval(() => {
    if(!document.querySelector("#chat-container")){
        addChatUi();
    }
    document.querySelector("#chat-container").style.right = (document.querySelector("#weapons-container").getBoundingClientRect().width + 20).toString() + "px";
    document.querySelector("#messages-container").style.maxWidth = document.querySelector("#chat-textbox").getBoundingClientRect().width.toString() + "px";
}, 500);
setTimeout(() => {
    clearInterval(tmp_int);
}, 10000);

window.addEventListener("resize", function(e){
    document.querySelector("#chat-container").style.right = (document.querySelector("#weapons-container").getBoundingClientRect().width + 20).toString() + "px";
    document.querySelector("#messages-container").style.maxWidth = document.querySelector("#chat-textbox").getBoundingClientRect().width.toString() + "px";
});

//will add server api for users online count

async function show_online_count(){
    let res = await fetch("https://suroihax.glitch.me/api/online", {
        "mode": "cors",
        "method": "GET",
        "headers": {
            "suroihax-auth": window._HACK_KEY
        }
    });
    let text = await res.text();
    let playercountspan = document.getElementById("suroihax-player-count");
    if(!playercountspan){
        let span = document.createElement("span");
        span.id = "suroihax-player-count";
        //span.style.padding = "0px 0px 4px 0px";
        span.style.display = "block";
        let ref = document.querySelector("#server-select");
        ref.parentNode.insertBefore(span, ref.nextSibling);
        playercountspan = document.getElementById("suroihax-player-count");
    }
    playercountspan.innerText = "SUROIHAX online players: " + text;
}

setInterval(show_online_count, 5000);