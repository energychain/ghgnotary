module.exports = function(RED) {
    function WalletConfiguration(n) {
        RED.nodes.createNode(this,n);

        this.host = n.host;
        this.port = n.port;
        this.baseDir = '.';
        if(typeof RED.settings.userDir !== 'undefined') {
            this.baseDir = RED.settings.userDir;
        }
        node = this;

        this.getPrivateKey = function() {
            console.log("I do something here");
        };

        this.persistCertificate = function(certificate) {
            const fs = require("fs");
            
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            if(!fs.existsSync(certificatestDir)) {
                fs.mkdirSync( certificatestDir,{recursive:true});
                fs.writeFileSync(certificatestDir+"index.json","[]");
            } 
            const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            indexJSON.push({
                certificate:certificate.did.payload.uid,
                time:new Date().getTime(),
                wh:certificate.presentations.consumption.payload.actual,
                emissions:certificate.presentations.ghg.payload.actual.grid,
                savings:certificate.presentations.ghg.payload.saving.grid
            })
            fs.writeFileSync(certificatestDir+""+certificate.did.payload.uid.toLowerCase()+".json",JSON.stringify(certificate));
            fs.writeFileSync(certificatestDir+"index.json",JSON.stringify(indexJSON));
        }

        this.persistPresentation = function(presentation) {
            const fs = require("fs");
            
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/presentations/";
            if(!fs.existsSync(certificatestDir)) {
                fs.mkdirSync( certificatestDir,{recursive:true});
                fs.writeFileSync(certificatestDir+"index.json","[]");
            } 
            const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            indexJSON.push({
                presentation:presentation.payload.payload.hash,
                time:new Date().getTime(),
                owner:presentation.owner,
                issuer:presentation.issuer,
                schema:presentation.payload["$schema"]
            })
            const typestr = presentation.payload["$schema"].substring( presentation.payload["$schema"].lastIndexOf("/")+1)
            fs.writeFileSync(certificatestDir+""+presentation.payload.payload.hash.toLowerCase()+"."+typestr+".json",JSON.stringify(presentation));
            fs.writeFileSync(certificatestDir+"index.json",JSON.stringify(indexJSON));
        }
        this.getCertificatesList = async function() {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            let indexJSON = [];
            if(fs.existsSync(certificatestDir+"index.json")) {
                indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            }
            indexJSON.sort((a,b) => b.time - a.time);
            return indexJSON;
        }
        this.getPresentationsList = async function() {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/presentations/";
            try {
                const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
                indexJSON.sort((a,b) => b.time - a.time);
                return indexJSON;
            } catch(e) {
                return;
            }
        }      
        this.getCertificateById = async function(certificateId) {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            const certificate = JSON.parse(fs.readFileSync(certificatestDir+""+certificateId.toLowerCase()+".json"));
            return certificate;
        }
        this.getPresentation = async function(certificate,type,recipient) {
            certificate = await node.getCertificate(certificate);
            app_wallet.app.getPresentation(certificate,type,recipient);

        }

        // Method is called sync during init and provides after Init all operations as singleton
        this.getGhgWallet = async function() {
            if(typeof node.wallet == 'undefined') {
                const fs = require("fs");
                const ghgwallet = await import('ghgwallet');    
                const walletDir = node.baseDir+"/ghgwallets/"+n.id+"/";
                
                if(!fs.existsSync(walletDir)) {
                    fs.mkdirSync( walletDir,{recursive:true});
                    const tmp_wallet = await ghgwallet.default();
                    fs.writeFileSync(walletDir+"wallet.json",tmp_wallet.app.toString());
                } 
                if(fs.existsSync(walletDir+"wallet.json")) {
                    const persistance = JSON.parse(fs.readFileSync(walletDir+"wallet.json"));
                    node.wallet = await ghgwallet.default(persistance.options);
                }
            }
            return node.wallet;
        }

        this.getGhgWallet();
    }
    RED.nodes.registerType("wallet-config",WalletConfiguration);
}