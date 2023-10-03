const fs = require("fs");
const path = require("path");

module.exports = ({ user, HTTPError, assert, config }) => {

    assert(() => {
        if (!user.login) throw new HTTPError("Access Denied", 403);
    });

    if (!fs.existsSync(config.uploadDirectory)) {
        fs.mkdirSync(config.uploadDirectory,{recursive:true});
    }

    return {
        upload(params) {
            for (let i = 0; i < params.upload.length; i++) {
                let out=path.join(config.uploadDirectory, params.upload[i].name);
                fs.writeFileSync(out, params.upload[i].buffer);
                console.log(out);
            }
        },
        listUploads() {
            let files=fs.readdirSync(config.uploadDirectory);
            return {
                files,
                root:config.uploadPrefix
            }
        }
    }
}