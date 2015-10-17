//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rIp     = require("ip"),
    rAsync  = require("async"),
    rHttp   = require("http");

//-----------------------------------------------------

var gIpsRange   = require("./ipsRanges.json"),
    gPorts      = [80, 88, 8080, 443, 1443];

//-----------]>

if(process.argv.length > 2)
    gPorts = process.argv.slice(2);

//-----------]>

console.log("\n+---------------------------------");
console.log("| Ports: %s", gPorts);
console.log("+---------------------------------\n");

//--------------------------------------]>

rAsync.eachSeries(gIpsRange, onIterRange, onEndIterRange);

//--------------------------------------]>

function onIterRange(range, callback) {
    var startIp     = rIp.toLong(range.range_start),
        endIp       = rIp.toLong(range.range_end),

        ipsRange    = [];

    //-----------]>

    console.log("\n|> Range: %s - %s", rIp.fromLong(startIp), rIp.fromLong(endIp));

    //-----------]>

    rAsync.whilst(
        () => genIpRange().length,
        (next) => rAsync.each(ipsRange, onIterIpRange, next),
        onEndIterIpRange
    );

    //-----------]>

    function onIterIpRange(ip, next) {
        var httpOpts = {"host": ip};

        //------------]>

        rAsync.each(
            gPorts,
            function(port, cbEnd) {
                httpGet(port, (error, response) => { if(!error) save(ip, port, response); cbEnd(); });
            },
            next
        );

        //------------]>

        function httpGet(port, cbEnd) {
            httpOpts.port = port;

            var req = rHttp
                .get(httpOpts, (res) => cbEnd(null, res))
                .setTimeout(500, () => req.abort())
                .on("error", cbEnd);
        }
    }

    function onEndIterIpRange(error) {
        callback(error);
    }

    //----)>

    function genIpRange(l) {
        l = l || 30;

        while(l--) {
            if(startIp > endIp)
                return ipsRange = ipsRange.splice(l + 1);

            ipsRange[l] = rIp.fromLong(startIp++);
        }

        return ipsRange;
    }

}

function onEndIterRange(error) {
    console.log(error || "End");
}

//------------]>

function save(ip, port, response) {
    var contentLength = response.headers["content-length"];
    contentLength = parseInt(contentLength, 10);

    if(!contentLength)
        return;

    console.log("Response: %s:%s | %s / %s", ip, port, response.statusCode, contentLength);
}