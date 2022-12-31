
module.exports = function(RED) {
    const lib = require("./lib.js");
    function Certificates(config) {
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            const app_wallet = await node.ghgwallet.getGhgWallet();
            const certs = await node.ghgwallet.getCertificatesList();
            
            let total_wh =  0;
            let total_emissions =0;
            let total_savings =0;

            for(let i=0;i<certs.length;i++) {
                if(typeof certs[i].emissions !== 'undefined') total_emissions += certs[i].emissions;
                if(typeof certs[i].savings !== 'undefined') total_savings += certs[i].savings;
                if(typeof certs[i].wh !== 'undefined') total_wh += certs[i].wh;
            }

            msg.payload = certs
            node.send(msg);
        });
    }
    RED.nodes.registerType("certificates",Certificates);
}