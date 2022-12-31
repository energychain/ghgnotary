module.exports = function(RED) {
    const lib = require("./lib.js");
    function validator(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            const app_wallet = await node.ghgwallet.getGhgWallet();

            const singleSend = async function(payload,signature,signer ) {      
                const probe = (await app_wallet.tydids.verifyMessage(payload,signature)).toLowerCase();
                if(signer.toLowerCase() ==  probe) {
                    return payload;
                } else {
                    throw "Invalid Signature/Signer combination"; 
                }
            }
            try {
            if(Array.isArray(msg.payload)) {
                let payload = [];
                for(let i=0;i<msg.payload.length;i++) {
                    const r = await singleSend(msg.payload[i].payload,msg.payload[i].signature,msg.payload[i].iss);
                    if((typeof r !=='undefined') && (r !== null)) {
                        payload.push(msg.payload[i]);
                    }  
                }
                msg.payload = payload;

            } else {
               const r =  await singleSend(msg.payload.payload,msg.payload.signature,msg.payload.iss);
               if((typeof r !=='undefined') && (r !== null)) {
                node.status({fill:'green',shape:"dot",text:""});
                node.send(msg);
               }
            }              
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to validate ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("validator",validator);
}