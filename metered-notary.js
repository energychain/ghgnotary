
module.exports = function(RED) {
    const lib = require("./lib.js");
    function MeteredNotary(config) {
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        const lMAX_RETRY = 10;

        node.on('input', async function(msg) {
            let certificate = null;
            let i=0;
            let err = "Retry: failed!";
            while((certificate == null)&&(i<lMAX_RETRY)) {
                try {
                    const app_wallet = await node.ghgwallet.getGhgWallet();
                    const zip = '00000';
                    let context = {
                        usage:'unknown'
                    }
                    if(typeof app_wallet == 'undefined') {
                        node.status({fill:'red',shape:"dot",text:"Unable to open Wallet"});
                    } else {
                        node.status({fill:'yellow',shape:"dot",text:"Wallet:"+app_wallet.address.substring(0,15)+"..."});
                    }
                    let reading = msg.payload;
                  
                    if(typeof msg.payload.reading !== 'undefined') reading = msg.payload.reading;

                    if(typeof msg.payload.context !== 'undefined') context = msg.payload.context;
                    if(typeof msg.topic !== 'undefined') context = msg.topic;
                    if((typeof config.context !== 'undefined') && (config.context !== null) && (config.context.length > 2)) {
                        context = JSON.parse(config.context); 
                    }
                    const intermediate = await app_wallet.app.requestIntermediate(zip,0,context,reading);
                    if(typeof intermediate.err !== 'undefined') {
                        err = intermediate.err;
                        i = lMAX_RETRY;
                    } else {
                        node.status({fill:'yellow',shape:"dot",text:"Intermediate:"+intermediate.hash.substring(0,15)+"..."});                 
                        const hash = await app_wallet.tydids.hashMessage(intermediate.payload);
                        if(intermediate.hash !== hash) {
                            node.status({fill:'red',shape:"dot",text:"Intermediate: hash !== calculated hash"});
                        } else {
                                    certificate = await app_wallet.app.requestCertification(intermediate);
                            }
                        node.ghgwallet.persistCertificate(certificate);
                        node.status({fill:'green',shape:"dot",text:"Certificate:"+certificate.did.payload.uid.substring(0,15)+"..."});
                        msg.payload = certificate;
                        node.send(msg);
                    }
                } catch(e) {
                    console.log(e);
                    node.status({fill:'red',shape:"dot",text:"Retry:"+i+"/10"});
                    await new Promise(r => setTimeout(r, 1000+(Math.round(Math.random()*10000))));
                    i++;
                }
            }
            if(certificate == null) {
                node.status({fill:'red',shape:"dot",text:err});
            }
        });
    }
    RED.nodes.registerType("metered-notary",MeteredNotary);
}