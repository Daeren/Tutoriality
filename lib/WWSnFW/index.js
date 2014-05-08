//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rHTTP       = require("http"),
    rWS         = require("ws"),
    rWatcher    = require("chokidar"),
    rFS         = require("fs");

var gSrvPORT = 1337;

//-----------------------------------------------------

var objWebServer    = rHTTP.createServer(fHandler),
    objWWServer     = new rWS.Server({"server": objWebServer});

var objWatcher = rWatcher.watch(__dirname + "/public", {"ignoreInitial": true, "usePolling": true});

//-----)>

objWWServer.broadcast = function(data) {
    for(var i = 0; i < this.clients.length; i++)
        this.clients[i].send(data);
};

objWatcher
    .on("add", fBroadcast).on("change", fBroadcast)
    .on("error", function(error) {
        console.log("ERR:Watcher", error);
    });

objWebServer.listen(gSrvPORT);

//-----)>

function fHandler(req, res) {
    rFS.readFile(__dirname + "/index.html", function(error, data) {
        if(error) {
            res.writeHead(500);
            return res.end("Error loading index.html");
        }

        res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
        res.end(data);
    });
}

function fBroadcast(file) {
    console.log("File: %s", file);

    rFS.readFile(file, function(error, data) {
        if(error)
            return console.log(error);

        objWWServer.broadcast(JSON.stringify({
            "name": file.split(/\\|\//g).pop(),
            "data": data.toString(),
            "time": Date.now()
        }));
    });
}