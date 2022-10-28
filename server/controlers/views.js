const fs = require('fs');

module.exports = () => {
    return {
        list() {
            let files = fs.readdirSync("www/views");
            let out = [];
            for (let i = 0; i < files.length; i++) {
                if (files[i].toLowerCase().endsWith(".js")) out.push(files[i]);
            }
            return out;
        }
    }
}