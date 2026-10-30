//autoupgrade to https
if(window.location.protocol != "https:"){
  window.location.href = window.location.href.replace("http", "https");
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
function genKey(){
    document.querySelector("#key").innerText = makeid(20);
}
function expandContent(e){
    if(this.innerText.length < 10){
        this.innerText = this.getAttribute("data-full");
    }
    else{
        this.innerText = this.getAttribute("data-full").slice(0, 5) + "...";
    }
}
//autistic autosave

setInterval(function(){
  localStorage.setItem("token", document.querySelector("#token").value);
}, 100)

function newTempUser(){
    obj = {};
    obj[makeid(20)] = {
        "name": prompt("Name?") || "New Key",
        "uses": 0,
        "usage_cap": 5,
        "type": "normal",
        "created": (new Date()).toISOString()
    }
    fetch("/newUser?data=" + btoa(JSON.stringify(obj)), {
        headers: {
            "Authorization": "Bearer " + btoa("urmom:" + document.querySelector("#token").value)
        }
    }).then(res => {
        if(res.status == 200){
            window.location.reload();
        }
        else if(res.status == 401){
            alert("Invalid token");
        }
        else{
            alert("An unknown error occured");
        }
    });
}
function handleSave(e){
    let key = this.parentNode.parentNode.querySelector(".table-key").getAttribute("data-old-key");
    let new_key = this.parentNode.parentNode.querySelector(".table-key").value;
    let name = this.parentNode.parentNode.querySelector(".table-name").value;
    let type = this.parentNode.parentNode.querySelector(".table-type").value;
    let usage_cap = this.parentNode.parentNode.querySelector(".table-usage-cap").value;
    let revoke_reason = this.parentNode.parentNode.querySelector(".table-revoke-reason").value;
    localStorage.setItem("currentpage", window.datatable.page());
    localStorage.setItem("currentsort", JSON.stringify(window.datatable.order()[0]));
    if(!name || !new_key || !type){
        alert("Invalid options");
        return;
    }
    let parsedjson = {
        name: name,
        type: type
    };
    if(isNaN(usage_cap)){
        alert("Invalid usage cap");
    }
    if(usage_cap){
        parsedjson.usage_cap = parseInt(usage_cap);
    }
    if(revoke_reason){
        parsedjson.revoke_reason = revoke_reason;
    }
    console.log("Updating", key, parsedjson);
    fetch("/editUser?target=" + btoa(key) + "&data=" + btoa(JSON.stringify(parsedjson)) + "&newkey=" + btoa(new_key), {
        headers: {
            "Authorization": "Bearer " + btoa("urmom:" + localStorage.getItem("token"))            
        }
    }).then(res => {
        if(res.status == 200){
            
            window.location.reload();
        }
        else if(res.status == 401){
            alert("Invalid token");
        }
        else{
            alert("An unknown error occured");
        }
    });
}
function handleDelete(e){
    localStorage.setItem("currentpage", window.datatable.page());
    localStorage.setItem("currentsort", JSON.stringify(window.datatable.order()[0]));
    if(this.innerText == "Sure?"){
        let key = this.parentNode.parentNode.querySelector(".table-key").getAttribute("data-old-key");
        console.log("Deleting", key);
        fetch("/deleteUser?target=" + btoa(key), {
            headers: {
                "Authorization": "Bearer " + btoa("urmom:" + localStorage.getItem("token"))            
            }
        }).then(res => {
            if(res.status == 200){
                window.location.reload();
            }
            else if(res.status == 401){
                alert("Invalid token");
            }
            else{
                alert("An unknown error occured");
            }
        });
    }
    else{
        this.innerText = "Sure?";
    }
}
function toLocalTime(time){
    return (new Date(time)).toLocaleDateString() + " " + (new Date(time)).toLocaleTimeString();
}
function showDetails(user_key){
    console.log("Showing details for", user_key);
    document.querySelector("#main").style.display = "none";
    document.querySelector("#details").style.display = "block";
    document.querySelector("#user-name").innerText = window.current_keys[user_key].name;
    window.scrollTo(0,0);
    var current_user_actions = [];
    var ips = {};
    var accesses = 0;
    var accesses_today = 0;
    window.accesslog.forEach(function(access){
        if(access.user == window.current_keys[user_key].name){
            current_user_actions.push(access);
            accesses += 1;
            if(Date.now() - new Date(access.time) < 1000 * 60 * 60 *24){
                accesses_today += 1;
            }
            if(!ips[access.ip.split(",")[0]]){
                ips[access.ip.split(",")[0]] = new Date(access.time);
            }
            else{
                if(ips[access.ip.split(",")[0]].getTime() < new Date(access.time).getTime()){
                    ips[access.ip.split(",")[0]] = new Date(access.time);
                }
            }
        }
    });
    ips = Object.fromEntries(
        Object.entries(ips).sort(([,a],[,b]) => a.getTime() - b.getTime())
    );
    Object.keys(ips).forEach(function(k){
        var tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${k}</td>
        <td>${toLocalTime(ips[k])}</td>
        `;
        document.querySelector("#ip-addrs").after(tr);
    });
    document.querySelector("#times-accessed").innerHTML = `Times accessed: <b>${accesses}</b>, Last 24h: <b>${accesses_today}</b>`
    document.querySelector("#ipaddrcnt").innerText = "IP Addresses: " + Object.keys(ips).length.toString();
    var clients = {};
    var plays = 0;
    var plays_today = 0;
    window.playlogs.forEach(function(e){
        if(e.user == window.current_keys[user_key].name){
            current_user_actions.push(e)
            plays += 1;
            if(Date.now() - new Date(e.time) < 1000 * 60 * 60 *24){
                plays_today += 1;
            }
        }
        if(e.user == window.current_keys[user_key].name && e["client-id"]){
            if(!clients[e["client-id"]]){
                clients[e["client-id"]] = new Date(e.time);
            }
            else{
                if(clients[e["client-id"]].getTime() < new Date(e.time).getTime()){
                    clients[e["client-id"]] = new Date(e.time);
                }
            }
        }
    });
    clients = Object.fromEntries(
        Object.entries(clients).sort(([,a],[,b]) => a.getTime() - b.getTime())
    );
    Object.keys(clients).forEach(function(k){
        var tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${k}</td>
        <td>${toLocalTime(clients[k])}</td>
        `;
        document.querySelector("#client-ids").after(tr);
    });
    document.querySelector("#games-played").innerHTML = `Games played: <b>${plays}</b>, Last 24h: <b>${plays_today}</b>`
    document.querySelector("#clientcnt").innerText = "Client IDs: " + Object.keys(clients).length.toString();
    //sort chat logs
    window.chatlogs.forEach(function(msg){
        if(msg["key-user"] == window.current_keys[user_key].name){
            current_user_actions.push(msg);
        }
    });
    current_user_actions.sort((a,b) => (
        new Date(a.time).getTime() - (new Date(b.time)).getTime()
    ));
    current_user_actions.forEach(function(action){
        if(action["user-agent"]){
            let ua = platform.parse(action["user-agent"]);
            action["user-agent"] = ua.description;
        }
        let tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${action.msg ? "Chat" : (action.ip ? "Page Load" : "Game Join")}</td>
        <td>${action.ip ? action.ip.split(",")[0] : ""}</td>
        <td data-full="${action["client-id"] || ""}">${
            action["client-id"] ? action["client-id"].slice(0, 5) + "..." : ""
        }</td>
        <td data-full="${action["user-agent"] || ""}">${
            action["user-agent"] ? action["user-agent"].slice(0, 5) + "...": ""
        }</td>
        <td>${action["suroiname"] || action["suroi-name"] || ""}</td>
        <td data-full="${action.msg || ""}">${
            action.msg ? (
                action.msg.length > 5 ?
                action.msg.slice(0, 5) + "..." :
                action.msg
            ) : ""
        }</td>
        <td>${toLocalTime(action.time)}</td>
        `;
        tr.querySelectorAll("td").forEach(function(el){
            el.style.whiteSpace = "nowrap";
        })
        tr.querySelectorAll("[data-full]").forEach(function(el){
            el.addEventListener("click", expandContent);
            el.style.textDecoration = "underline";
            el.style.cursor = "pointer";
            el.style.whiteSpace = "nowrap";
        })
        document.querySelector("#all-actions-table").prepend(tr);
    })
}
function hideDetails(){
    document.querySelector("#main").style.display = "block";
    document.querySelector("#details").style.display = "none";
    document.querySelector("#details").innerHTML = `
      <a href="javascript:hideDetails();">&lt; Back</a>
      <h1 id="user-name">[USER]</h1>
      <br />
      <h3>General Info:</h3>
      <span id="games-played">Games played: <b>0</b>, Last 24h: <b>0</b></span>
      <br />
      <span id="times-accessed">Times accessed: <b>0</b>, Last 24h: <b>0</b></span>
      <br />
      <br />
      <a href="javascript:document.getElementById('all-actions-header').scrollIntoView({behavior:'smooth'});">Jump to all actions</a>
      <br />
      <br />
      <table class="table table-striped table-bordered" id="info-table">
        <thead class="thead-light" id="client-ids">
          <tr>
            <th id="clientcnt">Client IDs: 0</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <thead class="thead-light" id="ip-addrs">
          <tr>
            <th id="ipaddrcnt">IP Addresses: 0</th>
            <th>Last Active</th>
          </tr>
        </thead>
      </table>
      <h2 id="all-actions-header">All Actions:</h2>
      <table class="table table-striped table-bordered collapse show" id="all-actions-table">
        <thead class="thead-light" id="client-ids">
          <tr>
            <th>Action</th>
            <th>IP</th>
            <th>Client ID</th>
            <th>User Agent</th>
            <th>Suroi Name</th>
            <th>Data</th>
            <th>Time</th>
          </tr>
        </thead>
      </table>`;
}
window.onload = function(){
    $("#token").value = localStorage.getItem("token");
    fetch("/getUsers").then((res) => {
        res.json().then((res) => {
            window.current_keys = res;
            /*DataTable.types().forEach(type => {
              DataTable.type(type, 'detect', () => false);
            });*/
            window.datatable = $("#main-table").DataTable();
            Object.keys(res).forEach(function(key){
                let thisrow = [
                  `<textarea rows="1" cols="40" class="table-name">${res[key].name}</textarea>`,
                  `<textarea rows="1" cols="25" class="table-key" data-old-key="${key}">${key}</textarea>`,
                  `<select class="table-type" data-current-type="${res[key].type}">
                      <option value="normal"${res[key].type == "normal" ? " selected=\"true\"" : ""}>Normal</option>
                      <option value="revoked"${res[key].type == "revoked" ? " selected=\"true\"" : ""}>Revoked</option>
                      <option value="admin"${res[key].type == "admin" ? " selected=\"true\"" : ""}>Admin</option>
                      <option value="owner"${res[key].type == "owner" ? " selected=\"true\"" : ""}>Owner</option>
                      <!--<option value="dev"${res[key].type == "dev" ? " selected=\"true\"" : ""}>Dev</option>-->
                      <option value="paid"${res[key].type == "paid" ? " selected=\"true\"" : ""}>Paid</option>
                  </select>`,
                  `${res[key].uses}`,
                  `<textarea rows="1" cols="3" class="table-usage-cap">${res[key].usage_cap || ""}</textarea>`,
                  `${!res[key].last_use ? "Unused" : toLocalTime(res[key].last_use)}`,
                  `${!res[key].created ? "N/A" : toLocalTime(res[key].created)}`,
                  `<textarea rows="1" cols="15" class="table-revoke-reason">${res[key].revoke_reason || ""}</textarea>`,
                  `<button disabled class="save">Save</button>
                   <button class="delete">Delete</button>
                   <br>
                   <a href="javascript:showDetails('${key}');">Details</a>`
                  ];
                window.datatable.row.add(thisrow);
            });
            window.datatable.draw();
            $("#main-table")[0].style = "";
            if(localStorage.getItem("currentsort")){
              window.datatable.order(JSON.parse(localStorage.getItem("currentsort"))).draw();
            }
            window.datatable.page(parseInt(localStorage.getItem("currentpage"))).draw("page");
        });
        setInterval(function(){
            $("#main-table")[0].querySelectorAll("tr").forEach(function(tr){
                try{
                  tr.querySelector(".save").addEventListener("click", handleSave);
                  tr.querySelector(".delete").addEventListener("click", handleDelete);
                  tr.querySelector(".delete").addEventListener("mouseout", function(e){
                      this.innerText = "Delete"
                  });
                  tr.addEventListener("change", function(){
                      this.querySelector(".save").removeAttribute("disabled");
                  });
                } catch(e){
                    //console.error(e);
                    //console.error("Failed loading details for", tr)
                }
            });
        }, 100)
    });
    fetch("/accesslog", {
        "headers": {
            "Authorization": "Basic " + btoa("user:" + localStorage.getItem("token"))
        }
    }).then(res => {
        res.json().then(json => {
            window.accesslog = json;
        })
    });
    fetch("/chatlogs", {
        "headers": {
            "Authorization": "Basic " + btoa("user:" + localStorage.getItem("token"))
        }
    }).then(res => {
        res.json().then(json => {
            window.chatlogs = json;
        })
    });
    fetch("/playlogs", {
        "headers": {
            "Authorization": "Basic " + btoa("user:" + localStorage.getItem("token"))
        }
    }).then(res => {
        res.json().then(json => {
            window.playlogs = json;
        })
    });
}
window.addEventListener("keydown", function(e){
    if(e.key == "Escape"){
        hideDetails();
    }
})