const fs = require('fs');
const sList = fs.readFileSync("./misc/dm_sentences.txt").toString().split('\n');

module.exports = {
    randomDM() {
        let index = Math.round(Math.random() * (sList.length - 1));
        return sList[index];
    }
}