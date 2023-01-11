
module.exports = function(RED) {
    const lib = require("./lib.js");
    function Statistics(config) {
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {

            const app_wallet = await node.ghgwallet.getGhgWallet();

            const certs = await node.ghgwallet.getCertificatesList();

            let total_wh =  0;
            let total_emissions =0;
            let total_savings =0;
            let total_surplus =0;

            for(let i=0;i<certs.length;i++) {
                if(typeof certs[i].emissions !== 'undefined') total_emissions += certs[i].emissions;
                if(typeof certs[i].savings !== 'undefined') total_savings += certs[i].savings;
                if(typeof certs[i].surplus !== 'undefined') total_surplus += certs[i].surplus;
                if(typeof certs[i].wh !== 'undefined') total_wh += certs[i].wh;
            }
            
            msg.payload = {
                certificates: {
                    count:certs.length,
                    sums: {
                        wh:total_wh,
                        emissions:total_emissions,
                        savings:total_savings,
                        surplus:total_surplus
                    }
                }
            }
            if(typeof app_wallet !== 'undefined') {
                msg.payload.address = app_wallet.address;
                msg.payload.txBalance = (await app_wallet.getBalance()).toString();
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType("statistics",Statistics);
}