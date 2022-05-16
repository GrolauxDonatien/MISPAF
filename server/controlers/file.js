const fs=require("fs");
const path=require("path");

module.exports={
    upload({params, HTTPError, config}) {
        for(let i=0; i<params.upload.length; i++) {
            fs.writeFileSync(path.join(config.uploadDirectory,params.upload[i].name),params.upload[i].buffer);
        }
    }
}