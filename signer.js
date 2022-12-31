module.exports = function(RED) {
    const lib = require("./lib.js");
    function signer(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            const app_wallet = await node.ghgwallet.getGhgWallet();

            const singleSend = async function(payload ) {      
                payload.hash =  app_wallet.tydids.hashMessage(payload);
                let npayload = {
                    payload:payload,
                    iss:app_wallet.address,
                    iat:new Date().getTime(),
                    signature:await app_wallet.tydids.signMessage(payload)
                }        
                return npayload;
            }
            try {
            if(Array.isArray(msg.payload)) {
                let payload = [];
                for(let i=0;i<msg.payload.length;i++) {
                    payload.push(await singleSend(msg.payload[i]));
                }
                msg.payload = payload;

            } else {
                msg.payload = await singleSend(msg.payload);
            }           
            node.status({fill:'green',shape:"dot",text:""});
            node.send(msg);
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to sign ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("signer",signer);
}