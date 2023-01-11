module.exports = function(RED) {
    const lib = require("./lib.js");
    function transfer(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            try {
                const app_wallet = await node.ghgwallet.getGhgWallet();
                if((typeof config.aggregation !== 'undefined') && (config.aggregation)) {
                    console.log("Trying to move ",config.recipient,msg.payload.did.payload.nft.payload.tokenId);
                    const r = await app_wallet.app.transferCertificateToAggregation(config.recipient,msg.payload);
                    msg.payload = r;
                    if(r == null) {
                        msg.payload = {
                            err:"Transfer to aggregation failed permanently.",
                            ref:"https://l.stromdao.de/ghgaggregation"
                        }
                        node.status({fill:'red',shape:"dot",text:msg.payload.err});
                    } else {
                        node.status({fill:'green',shape:"dot",text:"TX:"+r.nonce});
                    }
                    node.send(msg);
                } else {
                    const r = await app_wallet.app.transferCertificateOwnership(config.recipient,msg.payload);
                    msg.payload = r;
                    node.send(msg);
                    node.status({fill:'green',shape:"dot",text:""});
                }
                
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to send ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("transfer",transfer);
}