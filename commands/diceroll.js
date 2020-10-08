'use strict';

const { okMessage, errorMessage } = require('../modules/InfoMessage.js');
const { Message } = require('discord.js')

let map = function (x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

let dice = function (max) {
    let n = map(Math.random(), 0, 1, 1, max);
    n = Math.round(n);
    return n;
}

module.exports = {
    name: 'diceroll',
    adminOnly: false,
    description: 'Roll a dice!',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let value = 0;
        let arg = (args.length > 0) ? args.join('') : '1d6';
        let diceStr = '';
        let m = arg.match(/d/);

        if (m && m.index != 0) {
            let rollTimes = parseInt(arg.substring(0, m.index).replace(/[^0-9]/g, '', 'g'));
            let faces = parseInt(arg.substring(m.index + 1).replace(/[^0-9]/g, '', 'g'));
            if (!isNaN(rollTimes) && !isNaN(faces)) {
                if (rollTimes > 100) return errorMessage(message, `Don't make me roll a d${faces} for ${rollTimes} times...`);
                for (let i = 0; i < rollTimes; i++) value += dice(faces);
                diceStr = `${rollTimes}d${faces}`;
            } else {
                value = dice(6);
                diceStr = '1d6';
            }
        } else {
            let input = parseInt(arg.replace(/[^0-9]/g, '', 'g'));
            if (isNaN(input)) {
                input = 6;
                diceStr = '1d6';
            } else {
                diceStr = `1d${input}`;
            }
            value = dice(input);
        }

        okMessage(message, `You rolled ${diceStr} and got **${value}**`)
        //message.reply(`You rolled ${diceStr} and got **${value}**`);
    }
}