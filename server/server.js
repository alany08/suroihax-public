const path = require("path");
const fs = require('node:fs');
const http_request = require('sync-request');
const { v4: uuidv4 } = require("uuid");
const { createHash } = require('crypto');
const suroihax_api_base = "suroihax.duckdns.org:6969"

const fastify = require("fastify")({
  logger: true,
  https: {
    key: fs.readFileSync("/etc/letsencrypt/live/suroihax.duckdns.org/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/suroihax.duckdns.org/fullchain.pem")
  }
});

const archiver = require('archiver');
function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

fastify.register(require("@fastify/formbody"));
fastify.register(require('@fastify/websocket'));

const connectedPlayers = {};

function sendDiscordLog(log_user, data){
  http_request("POST", process.env["discord_hook"], {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "content": `Action performed by \`${log_user}\`\n\`\`\`${data}\`\`\``
    })
  });
}

sendDiscordLog("System", "Server has restarted, and is now online");

function broadcastMsg(msg, origin_socket){
  try{
    msg = JSON.parse(msg);
  } catch {
    return "Failed to parse message";
  }
  let key = msg.hack_key;
  let keydb = JSON.parse(fs.readFileSync(".data/users.json").toString());
  let current_logs = JSON.parse(fs.readFileSync(".data/chatlogs.json"));
  if(keydb[key]){
    if(!keydb[key].revoked && !keydb[key].usage_cap){
      current_logs.unshift({
        "key-user": keydb[key].name,
        "suroi-name": msg.user,
        "msg": msg.content,
        "gameid-region": msg.region + " " + msg.gameid,
        "time": (new Date()).toISOString()
      });
      fs.writeFileSync(".data/chatlogs.json", JSON.stringify(current_logs, null, 4));
      delete msg.hack_key;
      Object.values(connectedPlayers).forEach(function(socket){
        socket.send(JSON.stringify(msg));
      });
    }
    else if(keydb[key].usage_cap > keydb[key].uses){
      current_logs.unshift({
        "key-user": keydb[key].name,
        "suroi-name": msg.user,
        "msg": msg.content,
        "gameid-region": msg.region + " " + msg.gameid,
        "time": (new Date()).toISOString()
      });
      fs.writeFileSync(".data/chatlogs.json", JSON.stringify(current_logs, null, 4));
      delete msg.hack_key;
      Object.values(connectedPlayers).forEach(function(socket){
        socket.send(JSON.stringify(msg));
      });
    }
    else{
      origin_socket.send(JSON.stringify({
        "user": "SYSTEM",
        "content": "INVALID KEY",
        "gameid": "-1",
        "region": "SYS"
      }))
      origin_socket.close();
    }
  }
  else{
    origin_socket.send(JSON.stringify({
      "user": "SYSTEM",
      "content": "INVALID KEY",
      "gameid": "-1",
      "region": "SYS"
    }))
    origin_socket.close();
  }
}

//we will need teaming code soon™
/*
fastify.register(async function(fastify){
  fastify.get('/team/*', { websocket: true }, (connection, req) => {
    const socket_id = uuidv4();
    connectedPlayers[socket_id] = connection;
    connection.on("close", function(ws){
      delete connectedPlayers[socket_id];
    });
    connection.on("message", function(msg){
      if(msg.toString().length <= 256){
        broadcastMsg(msg.toString());
      }
    });
  });
});
*/

//bruh has to be async

fastify.get("/serverBackup", 
  async function (request, reply) {
    sendDiscordLog("Owner", "A server backup attempt has been triggered");
    if(authenticateOwnerPage(request)){
      sendDiscordLog("Owner", "A server backup has begun (auth success)");
      reply.header("content-type", "application/zip");
      reply.header("content-disposition", "attachment; filename=\"backup.zip\"");
      await zipDirectory(".", "/tmp/backup.zip");
      sendDiscordLog("Owner", "A server backup has finished");
      return reply.send(fs.readFileSync("/tmp/backup.zip"));
    }
    else{
      reply.statusCode = 401;
      reply.header("WWW-Authenticate", "Basic realm=\"*\"");
      sendDiscordLog("Owner", "A server backup request has failed authentication");
      return reply.send("Could not authenticate");
    }
  }
);

//simple broadcast websocket
fastify.register(async function(fastify){
  fastify.get('/chat', { websocket: true }, (connection, req) => {
    const socket_id = uuidv4();
    connectedPlayers[socket_id] = connection;
    Object.keys(connectedPlayers).forEach(player => {
      if(connectedPlayers[player]._readyState != 1){
        delete connectedPlayers[player];
        console.log("Found stale socket with ID", player, "deleting...");
      }
    })
    connection.send(JSON.stringify({
      "user": "SYSTEM",
      "content": `${Object.keys(connectedPlayers).length} Players connected to SUROIHAX`,
      "gameid": "-1",
      "region": "SYS"
    }))
    connection.on("close", function(ws){
      delete connectedPlayers[socket_id];
    });
    connection.on("message", function(msg){
      if(msg.toString().length <= 256){
        broadcastMsg(msg.toString(), connection);
      }
    });
  });
});

let updateAuthenticated = false;
let updateAuthenticated2 = false;
let newApp = "";

//return true or false based on status of authentication
function authenticateAdminPage(request){
  if(!request.headers["authorization"]){
    return false;
  }
  else{
    let pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
    let curr_pwds = fs.readFileSync(".data/users.json").toString();
    curr_pwds = JSON.parse(curr_pwds);
    let authenticating_user = curr_pwds[pwd];
    if(!authenticating_user){
      return false;
    }
    else{
      if(!["admin", "owner"].includes(authenticating_user.type)){
        return false;
      }
      else{
        return true;
      }
    }
  }
}

function authenticateOwnerPage(request){
  if(!request.headers["authorization"]){
    return false;
  }
  else{
    let pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
    let curr_pwds = fs.readFileSync(".data/users.json").toString();
    curr_pwds = JSON.parse(curr_pwds);
    let authenticating_user = curr_pwds[pwd];
    if(!authenticating_user){
      return false;
    }
    else{
      if(!["owner"].includes(authenticating_user.type)){
        return false;
      }
      else{
        return true;
      }
    }
  }
}

fastify.register(async function(fastify){
  fastify.get('/updateHacks', { websocket: true }, (connection, req) => {
    if(updateAuthenticated){
      connection.close();
    }
    else{
      connection.on("close", function(ws){
        updateAuthenticated = false;
      })
      connection.on("message", function(msg){
        if(msg.toString().startsWith("AUTHENTICATE")){
          let pwd = msg.toString().split(" ")[1];
          let curr_pwds = fs.readFileSync(".data/users.json").toString();
          curr_pwds = JSON.parse(curr_pwds);
          let authenticating_user = curr_pwds[pwd];
          sendDiscordLog("System", "Cheat update requested");
          if(!authenticating_user){
          sendDiscordLog("System", "Cheat update failed (could not find auth user)");
            connection.close();
            return;
          }
          else{
            if(authenticating_user.type != "owner"){
              sendDiscordLog(authenticating_user.name, "Cheat update failed (insufficient permissions)");
              connection.close();
              return;
            }
            else{
              updateAuthenticated = true;
              sendDiscordLog(authenticating_user.name, "Cheat update success, beginning the update...");
              newApp = "";
            }
          }
        }
        else if(updateAuthenticated && msg.toString() == "END"){
          let oldcheat = fs.readFileSync(".data/hack.js").toString();
          let newcheat = unescape(Buffer.from(newApp, 'base64').toString('ascii'));
          sendDiscordLog("System", `Script update finished:\n\nOld: ${
              (oldcheat.length/1000000).toFixed(2)
          }Mb, sha256: ${
              (createHash('sha256').update(oldcheat).digest('hex')).toString()
          }\nNew: ${
              (newcheat.length/1000000).toFixed(2)
          }Mb, sha256: ${
              (createHash('sha256').update(newcheat).digest('hex')).toString()
          }`);
          fs.writeFileSync(".data/hack.js", newcheat);
          newApp = "";
          updateAuthenticated = false;
          connection.send("SUCCESS");
          connection.close();
        }
        else if(updateAuthenticated){
          newApp = newApp + 
            msg.toString();
          connection.send("OK");
          console.log("Chunk Recieved");
        }
      })
    }
  });
});

fastify.register(async function(fastify){
  fastify.get('/updateHacksPaid', { websocket: true }, (connection, req) => {
    if(updateAuthenticated2){
      connection.close();
    }
    else{
      connection.on("close", function(ws){
        updateAuthenticated2 = false;
      })
      connection.on("message", function(msg){
        if(msg.toString().startsWith("AUTHENTICATE")){
          let pwd = msg.toString().split(" ")[1];
          let curr_pwds = fs.readFileSync(".data/users.json").toString();
          curr_pwds = JSON.parse(curr_pwds);
          let authenticating_user = curr_pwds[pwd];
          sendDiscordLog("System", "Cheat update requested");
          if(!authenticating_user){
          sendDiscordLog("System", "Cheat update failed (could not find auth user)");
            connection.close();
            return;
          }
          else{
            if(authenticating_user.type != "owner"){
              sendDiscordLog(authenticating_user.name, "Cheat update failed (insufficient permissions)");
              connection.close();
              return;
            }
            else{
              updateAuthenticated2 = true;
              sendDiscordLog(authenticating_user.name, "Cheat update success, beginning the update...");
              newApp = "";
            }
          }
        }
        else if(updateAuthenticated2 && msg.toString() == "END"){
          let oldcheat = fs.readFileSync(".data/hackpaid.js").toString();
          let newcheat = unescape(Buffer.from(newApp, 'base64').toString('ascii'));
          sendDiscordLog("System", `Paid script update finished:\n\nOld: ${
              (oldcheat.length/1000000).toFixed(2)
          }Mb, sha256: ${
              (createHash('sha256').update(oldcheat).digest('hex')).toString()
          }\nNew: ${
              (newcheat.length/1000000).toFixed(2)
          }Mb, sha256: ${
              (createHash('sha256').update(newcheat).digest('hex')).toString()
          }`);
          fs.writeFileSync(".data/hack.js", newcheat);
          newApp = "";
          updateAuthenticated2 = false;
          connection.send("SUCCESS");
          connection.close();
        }
        else if(updateAuthenticated2){
          newApp = newApp + 
            msg.toString();
          connection.send("OK");
          console.log("Chunk Recieved");
        }
      })
    }
  });
});

fastify.get("/*", 
  function (request, reply) {
    //screw cors
    reply.header("access-control-allow-origin", "*");
    if(request.url.startsWith("/joinedGame")){
      const key = request.query["key"];
      const suroiname = request.query["name"];
      const client_id = request.query["uuid"];
      var current_logs = fs.readFileSync(".data/playlogs.json");
      current_logs = JSON.parse(current_logs);
      var keydb = fs.readFileSync(".data/users.json");
      keydb = JSON.parse(keydb);
      if(!client_id){
        reply.statusCode = 403;
        return reply.send("PLEASE ALLOW TRACKERS, THIS IS TO KEEP THE SCRIPT WITHIN TRUSTED INDIVIDUALS");
      }
      if(keydb[key]){
        if(keydb[key].type != "revoked" && !keydb[key].usage_cap){
          current_logs.unshift({
            "user": keydb[key].name,
            "suroi-name": unescape(suroiname),
            "client-id": client_id,
            "time": (new Date()).toISOString()
          });
          fs.writeFileSync(".data/playlogs.json", JSON.stringify(current_logs, null, 4));
          reply.statusCode = 200;
          return reply.send("OK");
        }
        else if(keydb[key].usage_cap > keydb[key].uses && keydb[key].type != "revoked"){
          current_logs.unshift({
            "user": keydb[key].name,
            "suroi-name": unescape(suroiname),
            "client-id": client_id,
            "time": (new Date()).toISOString()
          });
          fs.writeFileSync(".data/playlogs.json", JSON.stringify(current_logs, null, 4));
          reply.statusCode = 200;
          return reply.send("OK");
        }
        reply.statusCode = 403
        if(keydb[key].type == "revoked"){
          return reply.send("YOUR KEY HAS BEEN REVOKED: " + keydb[key].revoke_reason);
        }
        if(keydb[key].usage_cap <= keydb[key].uses){
          return reply.send("MAX USAGE REACHED, CONTACT DEVS");
        }
      }
      reply.statusCode = 403;
      return reply.send("AUTH ERR");
    }
    if(request.url.startsWith("/users")){
      if(authenticateAdminPage(request)){
        sendDiscordLog("System", "Admin page was accessed");
        reply.header("content-type", "text/html");
        reply.statusCode = 200;
        return reply.send(fs.readFileSync("usrmgmt/index.html"));
      }
      else{
        sendDiscordLog("System", "Admin page was attempted (failed)");
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/usrmgmt.js")){
      if(authenticateAdminPage(request)){
        reply.header("content-type", "text/javascript");
        reply.statusCode = 200;
        return reply.send(fs.readFileSync("usrmgmt/index.js"));
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/deleteUser")){
      if(authenticateAdminPage(request)){
        let target = Buffer.from(request.query["target"], "base64").toString("ascii");
        try{
          let curr_pwds = fs.readFileSync(".data/users.json").toString();
          let source_pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
          if(
            ["owner", "admin"].includes(curr_pwds[target]) &&
            curr_pwds[source_pwd].type != "owner"
          ){
            reply.statusCode = 403;
            return reply.send("Cannot delete admin/owner key, contact dev");
          }
          curr_pwds = JSON.parse(curr_pwds);
          if(curr_pwds[target]){
            sendDiscordLog(curr_pwds[source_pwd].name, `Key Deleted (${target}):\n${JSON.stringify(curr_pwds[target], null, 4)}`);
            delete curr_pwds[target];
            fs.writeFileSync(".data/users.json", JSON.stringify(curr_pwds));
          }
          else{
            reply.statusCode = 500;
            return reply.send("DOES NOT EXIST");
          }
        }
        catch{
          reply.statusCode = 500;
          return reply.send("error parsing json");
        }
        reply.statusCode = 200;
        return reply.send("SUCCESS");
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/newUser")){
      if(authenticateAdminPage(request)){
        let data = Buffer.from(request.query["data"], "base64").toString("ascii");
        data = JSON.parse(data);
        if(["admin", "owner"].includes(data.type)){
          reply.statusCode = 403;
          return reply.send("Cannot directly make admin/owner key");
        }
        let new_key = Object.keys(data)[0];
        try{
          let curr_pwds = fs.readFileSync(".data/users.json").toString();
          curr_pwds = JSON.parse(curr_pwds);
          curr_pwds[new_key] = data[new_key];
          fs.writeFileSync(".data/users.json", JSON.stringify(curr_pwds));
          let source_pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
          sendDiscordLog(curr_pwds[source_pwd].name, `Key Created:\n ${JSON.stringify(data, null, 4)}`);
        }
        catch{
          reply.statusCode = 500;
          return reply.send("error parsing json");
        }
        reply.statusCode = 200;
        return reply.send("SUCCESS");
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/editUser")){
      if(authenticateAdminPage(request)){
        var target = Buffer.from(request.query["target"], "base64").toString("ascii");
        var new_key = Buffer.from(request.query["newkey"], "base64").toString("ascii");
        var data = Buffer.from(request.query["data"], "base64").toString("ascii");
        data = JSON.parse(data);
        try{
          if(!new_key){
            reply.statusCode = 400;
            return reply.send("no key provided");
          }
          var curr_pwds = fs.readFileSync(".data/users.json").toString();
          curr_pwds = JSON.parse(curr_pwds);
          var source_pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
          if(
            (
              ["admin", "owner"].includes(data.type) &&
              data.type != curr_pwds[target].type
            ) &&
            curr_pwds[source_pwd].type != "owner"
          ){
            reply.statusCode = 403;
            return reply.send("Cannot make owner/admin key, please contact dev");
          }
          var old_pwd = new Object();
          Object.assign(old_pwd, curr_pwds[target]);
          Object.keys(data).forEach(function(attribute){
            curr_pwds[target][attribute] = data[attribute]
          });
          if(!data.revoke_reason){
            delete curr_pwds[target].revoke_reason;
          }
          if(!data.usage_cap){
            delete curr_pwds[target].usage_cap;
          }
          if(new_key != target){
            curr_pwds[new_key] = curr_pwds[target]
            delete curr_pwds[target];
          }
          sendDiscordLog(curr_pwds[source_pwd].name, `Key Edited (${target} ->? ${new_key}):\n\nFrom:\n${JSON.stringify(old_pwd, null, 4)}\n\nTo:\n${JSON.stringify(curr_pwds[target], null, 4)}`);
          fs.writeFileSync(".data/users.json", JSON.stringify(curr_pwds));
        }
        catch(e){
          reply.statusCode = 500;
          console.error(e);
          return reply.send("error parsing json");
        }
        reply.statusCode = 200
        return reply.send("SUCCESS");
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/getUsers")){
      if(authenticateAdminPage(request)){
        reply.statusCode = 200;
        var users = fs.readFileSync(".data/users.json");
        users = JSON.parse(users.toString());
        var users_for_auth = new Object();
        Object.assign(users_for_auth, users);
        let source_pwd = Buffer.from(request.headers["authorization"].split(" ")[1], 'base64').toString('ascii').split(":")[1];
        sendDiscordLog(users_for_auth[source_pwd].name, "Users database was accessed");
        Object.keys(users).forEach(function(key){
          if(["admin", "owner"].includes(users_for_auth[key].type) && 
            source_pwd != key /*allow viewing of your own key*/ &&
            users_for_auth[source_pwd].type != "owner"
          ){
            let redaction = "REDACTED KEY " + (createHash('sha256').update(key).digest('hex').slice(0, 5)).toString();
            users[redaction] = new Object();
            Object.assign(users[redaction], users[key]);
            delete users[key];
            console.log("redacting", key, "to", redaction);
          }
        });
        return reply.send(JSON.stringify(users));
      }
      else{
        reply.statusCode = 200;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/accesslog")){
      if(authenticateAdminPage(request)){
        reply.statusCode = 200;
        reply.header("content-type", "application/json");
        return reply.send(fs.readFileSync(".data/accesslog.json"));
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/playlogs")){
      if(authenticateAdminPage(request)){
        reply.statusCode = 200;
        reply.header("content-type", "application/json");
        return reply.send(fs.readFileSync(".data/playlogs.json"));
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        reply.send("Could not authenticate");
      }
    }
    if(request.url.startsWith("/chatlogs")){
      if(authenticateAdminPage(request)){
        reply.header("content-type", "application/json");
        return reply.send(fs.readFileSync(".data/chatlogs.json"));
      }
      else{
        reply.statusCode = 401;
        reply.header("WWW-Authenticate", "Basic realm=\"*\"");
        return reply.send("Could not authenticate");
      }
    }

    /***
     * Static file handling
     ***/
    var isAsset = false;
    [
      "/client",
      "/constants",
      "/modulepreload",
      "/newsPosts",
      "/vendor",
      "/uiHelpers",
      "/browserAll",
      "/webworkerAll",
      "/_virtual_spritesheets"
    ].forEach(function(whitelist){
      if(request.url.startsWith(whitelist)){
        //isAsset = true; disable asset forwarding, do it in the script itself
      }
    }.bind(this));
    if(isAsset){
      let suroiAsset = http_request("GET", "https://suroi.io/assets" + request.url);
      reply.statusCode = suroiAsset.statusCode;
      let content_type = suroiAsset.headers["content-type"];
      if(request.url.endsWith(".js")){
        content_type = "text/javascript"; //double check
      }
      reply.header("content-type", content_type);
      return reply.send(suroiAsset.body.toString());
    }
  /*
    if(request.url.includes("client")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/client.js"));
    }
    if(request.url.includes("constants")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/constants.js"));
    }
    if(request.url.includes("modulepreload-polyfill")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/modulepreload-polyfill.js"));
    }
    if(request.url.includes("newsPosts")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/newsPosts.js"));
    }
    if(request.url.includes("vendor")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/vendor.js"));
    }
    if(request.url.includes("uiHelpers")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/uiHelpers.js"));
    }
    if(request.url.includes("browserAll")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/browserAll.js"));
    }
    if(request.url.includes("webworkerAll")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/webworkerAll.js"));
    }
    if(request.url.includes("_virtual_spritesheets-jsons-high-res")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/_virtual_spritesheets-jsons-high-res.js"));
    }
    if(request.url.includes("_virtual_spritesheets-jsons-low-res")){
      reply.header("content-type", "text/javascript");
      return reply.send(fs.readFileSync("assets/_virtual_spritesheets-jsons-low-res.js"));
    }*/

    /***
     * Misc urls
     ***/

    //discord
    if(request.url == "/"){
      reply.header("location", "https://discord.gg/wymyC8mkSF");
      reply.statusCode = 302;
      return reply.send("redirecting you to discord...");
    }
    if(request.url.startsWith("/instructions")){
      reply.statusCode = 200;
      reply.header("content-type", "text/html");
      return reply.send(fs.readFileSync("instructions.html"));
    }

    /***
     * Terms of Service Acceptance
     ***/

    if(request.url.startsWith("/dataConsent")){
      let key = request.query["key"];
      let consent = request.query["accept"];
      if(!key || !consent || !["true", "false"].includes(consent)){
        reply.statusCode = 400;
        return reply.send("INVALID PARAM: accept=[true, false]");
      }
      let users = fs.readFileSync(".data/users.json").toString();
      users = JSON.parse(users);
      consent = consent == "true";
      if(users[key]){
        if(users[key].type){
          if(users[key].data_consent){
            reply.statusCode = 422;
            return reply.send("USER HAS ALREADY CONSENTED TO DATA COLLECTION, PLEASE CONTACT AN ADMIN IN THE DISCORD IF YOU WOULD LIKE YOUR DATA REMOVED");
          }
          else{
            if(consent){
              users[key].data_consent = (new Date()).toISOString();
            }
            else{
              delete users[pwd];
            }
            fs.writeFileSync(".data/users.json", JSON.stringify(users));
            reply.statusCode = 200;
            return reply.send("SUCCESS, CONSENT=" + consent.toString());
          }
        }
      }
    }

    /***
     * Hack client authentication
     ***/

    if(request.url.startsWith("/hack.js")){
      reply.header("content-type", "text/javascript");
      try{
        let parsed = request.url.split("?")[1];
        if(parsed.split("=")[0] == "pwd"){
          let pwd = parsed.split("=")[1];
          let users = fs.readFileSync(".data/users.json").toString();
          users = JSON.parse(users);
          if(users[pwd]){
            //so u cant use __proto__ to authenticate
            if(users[pwd].type){
              if(users[pwd].type == "revoked"){
                return reply.send(`alert("This key has been revoked. Reason: ${users[pwd].revoke_reason || "none"}. If you have any questions please contact the developer.");`);
              }
              if(!users[pwd].data_consent){
                return reply.send(`
window._HACK_KEY="${pwd}";
window.acceptTerms = () => {
  if(document.getElementById("suroihax-consent").checked){
    fetch("https://${suroihax_api_base}/dataConsent?accept=true&key=" + window._HACK_KEY).then((r) => {
      window.location.reload();
    });
  }
  else{
    alert("You have not checked 'I consent to the terms stated above'");
  }
}
window.declineTerms = () => {
  if(window.confirm("This WILL remove your key, and you will lose access to this service. We will NOT reinstate your key")){
    if(window.confirm("Are you sure you would like to REMOVE your key, " + window._HACK_KEY)){
      fetch("https://${suroihax_api_base}/dataConsent?accept=false&key=" + window._HACK_KEY).then((r) => {
        window.location.reload();
      });
    }
  }
}
var div = document.createElement("div");
div.style.zIndex = "9999999";
div.style.backgroundColor = "grey";
div.style.borderRadius = "5px";
div.style.color = "white";
div.style.position = "absolute";
div.style.left = "50%";
div.style.top = "50%";
div.style.transform = "translate(-50%,-50%)";
div.style.padding = "20px";
div.innerHTML = \`
<b>Consent to Data Collection</b>

<p>By accessing and using our service, you agree to the collection
and indefinite retention of your IP address, username, browser information
such as vendor, operating system, and version, and unique
client identifiers. This data is essential to maintain service
integrity, including preventing the sharing of authentication
tokens. We will retain this information for as long as you use the
service or until you request its deletion.</p>

<p>To proceed to the script, please confirm your consent below. The page
will reload after consent. Checking the box below indicates your
consent to this data collection and retention policy.</p>

<p>If at any time you would like to have your data removed,
you can contact an administrator within the discord server.</p>

<form>
  <input type="checkbox" id="suroihax-consent" value="false" />
  <label for="suroihax-consent">I consent to the terms stated above.</label>
</form>

<br />
<br />

<button style="color: black" onclick="javascript:window.acceptTerms();">Accept</button>
<button style="color: red" onclick="javascript:window.declineTerms();">Decline, remove my key</button>

<br />
<br />

<footer>The page will reload after decline or accept.</footer>
\`
document.documentElement.appendChild(div);`);
              }
              if(users[pwd].usage_cap){
                if(users[pwd].uses >= users[pwd].usage_cap){
                  fs.writeFileSync(".data/users.json", JSON.stringify(users));
                  return reply.send(`alert("This key has reached it's maximum usage limit. You have already been warned ${users[pwd].usage_cap} times that this is a temporary key. Stop being an idiot.");`);
                }
              }
              let current_json = fs.readFileSync(".data/accesslog.json");
              current_json = JSON.parse(current_json);
              current_json.unshift({
                "user": users[pwd].name,
                "account-type": users[pwd].type,
                "time": (new Date()).toISOString(),
                "ip": request.headers["x-forwarded-for"],
                "user-agent": request.headers["user-agent"],
              });
              users[pwd].uses = users[pwd].uses + 1;
              let curr_date = new Date();
              users[pwd].last_use = curr_date.toISOString(); 
              fs.writeFileSync(".data/users.json", JSON.stringify(users));
              fs.writeFile(".data/accesslog.json", JSON.stringify(current_json, null, 4), err => {
                if (err) {
                  return reply.send("alert('Error updating DB, contact the developer please')");
                } else {
                  // file written successfully
                }
              });
              if(["paid"].includes(users[pwd].type)){
                return reply.send(fs.readFileSync(".data/hackpaid.js"));
              }
              /*if(["admin", "dev"].includes(users[pwd].type)){
                //its getting published lol who cares at this point
                return reply.send(fs.readFileSync(".data/hack.js"));
              }*/
              if(users[pwd].usage_cap){
                return reply.send(
                  "window._HACK_KEY=\"" +
                  pwd +
                  "\";" +
                  `alert("This is a TEMPORARY key for making the verification video.\\n${users[pwd].usage_cap - users[pwd].uses} USES REMAINING");` +
                  fs.readFileSync(".data/hack.js").toString()
                );
              }
              return reply.send(
                "window._HACK_KEY=\"" +
                pwd +
                "\";" +
                fs.readFileSync(".data/hack.js")
              );
            }
            else{
              return reply.send(`alert("did you really think using ${pwd} would work? you think im dumb?")`);
            }
          }
          else{
            reply.send("alert('Unauthorized for cheats. Get a key by joining the discord'); window.location.href = 'https://suroihax.glitch.me/';");
          }
        }
        else{
          reply.send("alert('Read the instructions, make sure you have entered a key properly')");
        }
      } catch(e){
        reply.send("alert('An error occured during authentication. Please contact a developer')");
        console.error(e);
      }
    }
    reply.statusCode = 404;
    return reply.send("404");
  }
);

fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
