
module.exports = function(RED) {
    const lib = require("./lib.js");
    function EventNotary(config) {
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            let certificate = null;
            let i=0;
            while((certificate == null)&&(i<10)) {
                try {
                    const app_wallet = await node.ghgwallet.getGhgWallet();
                    const zip = '';
                    
                    node.status({fill:'yellow',shape:"dot",text:"Wallet:"+app_wallet.address.substring(0,15)+"..."});
                    let wh = msg.payload;
                    if(typeof msg.payload.wh !== 'undefined') wh = msg.payload.wh;
                    let context = {
                        usage:'unknown'
                    }
                    if(typeof msg.payload.context !== 'undefined') context = msg.payload.context;
                    if(typeof msg.topic !== 'undefined') context = msg.topic;

                    const intermediate = await app_wallet.app.requestIntermediate(zip,wh,context);
                    node.status({fill:'yellow',shape:"dot",text:"Intermediate:"+intermediate.hash.substring(0,15)+"..."});

                    if(intermediate.payload.consumption.actual !== wh) {
                        node.status({fill:'red',shape:"dot",text:"Intermediate: consumption !== given wh ("+wh+")"});
                    } else {
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
                node.status({fill:'red',shape:"dot",text:"Retry: failed!"});
            }
            // Retry fail
        });
    }
    RED.nodes.registerType("event-notary",EventNotary);
}