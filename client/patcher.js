const fs = require("fs")
const https = require('https');
const parse = require('node-html-parser').parse;
const jsdom = require("jsdom");
const WebSocket = require('faye-websocket');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const { JSDOM } = jsdom;
const suroihax_api_base = "suroihax.glitch.me"
const zlib = require("zlib");

global.port = 6969
global.last_loaded = "";
global.old_patches = "";
global.old_free = "";
global.old_paid = "";
global.old_asseturl = "";
global.patches = "patches.json";
global.result_path = "suroi.io";
global.free = "out/free.js";
global.headers = {
    'accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    //"accept-encoding": "gzip, deflate, br", yeah zipping and compressing makes it harder
    "accept-language": "en-US,en;q=0.9,bs;q=0.8,fr;q=0.7",
    "dnt": "1",
    "sec-ch-ua": '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

function update(patches, appjs, asseturl){
    var pr = fs.readFileSync(free);
    if(asseturl != old_asseturl || old_patches != patches || old_free != pr.toString() /*|| old_paid != pd.toString()*/){
        console.log("Files changed, re-patching");
        console.log("Current asset URL:", asseturl);
        console.log(`What Changed:
AssetURL: ${asseturl !== old_asseturl}
Patches: ${old_patches != patches}
Free: ${old_free != pr.toString()}`);
        old_patches = patches;
        patches = JSON.parse(patches);
        var patched_file = appjs;
        patches.forEach(function(patch){
            if(patch["type"] == "replace"){
                //just use an escaped regex as a regex LOL
                var matches = patched_file.matchAll(new RegExp(patch["match"].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"));
                matches = Array.from(matches).length;
                patched_file = patched_file[patch["all"] ? "replaceAll" : "replace"](patch["match"], patch["replace"]);
            }
            else if(patch["type"] == "regex"){
                var matches = patched_file.matchAll(new RegExp(patch["match"], "g"));
                matches = Array.from(matches).length;
                patched_file = patched_file[patch["all"] ? "replaceAll" : "replace"](new RegExp(patch["match"], "g"), patch["replace"])
            }
            console.log(`(${patch["all"] ? matches : (matches == 0 ? "0" : "1")}/${matches}) Patched '${patch["name"]}' (${patch["all"] ? "all" : "single"})`);
        });
        patched_file = "\n" + patched_file;
        if(process.argv[2] != "dev"){
            // load the free one
            obffree = JavaScriptObfuscator.obfuscate(pr.toString(), {
                compact: true,
                identifierNamesGenerator: 'hexadecimal',
                numbersToExpressions: true,
                simplify: true,
                stringArray: true,
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayThreshold: 1,
                deadCodeInjection: false,
                target: "browser",
                sourceMap: true
            });
            var sourcemap = obffree.getSourceMap();
            fs.writeFileSync(result_path + "/source.js.map", sourcemap);
            obffree = obffree.getObfuscatedCode() + patched_file + "\n//# sourceMappingURL=http://localhost:6969/source.js.map";
            console.log("Finished obfuscating free");
            //send it to the server in base64
            let encoded = btoa(escape(obffree));
            //let encodedpaid = btoa(escape(obfpaid));
            console.log(`Updating free hacks from ${suroihax_api_base}`);
            var ws = new WebSocket.Client(`wss://${suroihax_api_base}/updateHacks`, [], {
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
                }
            });
            var chunks = [];
            var progress = -1;
            ws.on("open", function(e){
                ws.send("AUTHENTICATE [REDACTED]");
                chunks = encoded.match(/.{1,32768}/g);
                chunks.forEach(function(chunk){
                    ws.send(chunk);
                });
                ws.send("END");
            });
            process.stdout.write("Chunk 0/" + chunks.length.toString());
            ws.on("message", function(e){
                progress += 1;
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write("Chunk " + progress.toString() + "/" + chunks.length.toString());
                if(e.data == "SUCCESS"){
                    process.stdout.write("\n");
                    console.log("Success!")
                }
            });
            ws.on("close", function(e){
                console.log("WS Closed");
            });
        }
        else{
            fs.writeFileSync(result_path + asseturl, "window._HACK_KEY = '[REDACTED]';" + pr + patched_file);
            console.log("All Done!");
        }
        last_loaded = appjs;
        old_free = pr.toString();
        old_asseturl = asseturl;
    }
}

if(process.argv[2] == "dev"){
    global.cached_script = "";
}

async function main(){
        if(!global.cached_script){
            console.log("Making web request to suroi for script");
            let res = await fetch("https://suroi.io/", {
                headers: global.headers
            })
            let webpage = new JSDOM(await res.text());
            let scripts = webpage.window.document.querySelectorAll("script");
            asseturl = scripts[0].getAttribute("src");
            var asset = await fetch("https://suroi.io" + asseturl, {
                headers: global.headers
            });
            if(process.argv[2] == "dev"){
                global.cached_script = await asset.text();
                console.log("Dev mode on, cached script not yet loaded, caching...");
            }
        }
        var patches = fs.readFileSync(global.patches, 'utf8');
        update(
            patches, 
            process.argv[2] == "dev" ? (() => {
                //console.log("Loading cached script");
                return global.cached_script
            })() : await asset.text(),
            asseturl
        );
}

main = main.bind(this);

main();

setInterval(main, process.argv[2] == "dev" ? 100 : 300000);

async function backup(){
    console.log("Making server backup");
    const { body } = await fetch(`https://${suroihax_api_base}/serverBackup`, {
        "headers": {
            "Authorization": "Basic [REDACTED]"
        }
    });
    const fileStream = fs.createWriteStream("serverBackup.zip");
    await finished(Readable.fromWeb(body).pipe(fileStream));
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("Server backup success\n");
}

// quick expressjs server for dev mode to localhost
if(process.argv[2] == "dev"){
    console.log("Setting up HTTP server for local testing...");
    const express = require("express");
    const app = express();
    app.get("/", async (req, res) => {
        try{
            res.setHeader("Content-Type", "text/javascript");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.status(200).send(fs.readFileSync(result_path + global.old_asseturl));
        }
        catch{
            res.status(500).send("Internal Server Error");
        }
    });
    app.get("/source.js.map", async (req, res) => {
        res.status(200).send(fs.readFileSync(result_path + "/source.js.map"));
    })
    app.listen(global.port, () => {
        console.log("Local dev server live at port", global.port)
    });
}

if(process.argv[2] != "dev"){
    backup();

    setInterval(backup, 60*60*1000);
}