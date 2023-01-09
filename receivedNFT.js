module.exports = function(RED) {
    const lib = require("./lib.js");
    function ownedNFT(config) {
        RED.nodes.createNode(this,config);
        
        const init = async function(node) {
            
            node.ghgwallet = RED.nodes.getNode(config.wallet)
            let payload = {};
            while(typeof node.ghgwallet == 'undefined') {
                await new Promise(r => setTimeout(r, 50+ Math.round(Math.random()*200)));
            }

            if((typeof config.recipient !== 'undefined')&&(config.recipient.length == 42)) {
                payload.owner = config.recipient;
            } else {
                const app_wallet = await node.ghgwallet.getGhgWallet();
                payload.owner = app_wallet.address;
            }
            if(config.reply) {
                console.log("RELAYING");
                const payloads = await node.ghgwallet.ownedNFTs(payload);
                for(let i=0;i<payloads.length;i++) {
                    node.send({payload:payloads[i]});
                }
            }
            node.ghgwallet.receivedNFTSlistener(payload,node);
        }
        init(this);
    }
    RED.nodes.registerType("Received NFTs",ownedNFT);
}