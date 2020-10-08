const { Message } = require('discord.js');
const { errorMessage, okMessage, warnMessage } = require('../modules/InfoMessage.js');

module.exports = {
    name: 'say',
    adminOnly: true,
    description: 'Say something as the bot.',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let formatReminder = `Format: ${message.client.prefix}say [#channel-link] [message]`;

        if (args.length < 2) {
            return errorMessage(message, formatReminder);
        }

        let channelArg = args.shift();

        if (!channelArg.match(/^<#\d{18}>$/)) {
            return errorMessage(message, formatReminder);
        } else {
            let client = message.client;
            let channel = message.guild.channels.cache.get(channelArg.replace(/[^\d]/g, ''));

            if (!channel) {
                return errorMessage(message, `Channel not found`);
            } else {
                if (channel.type == 'text') {
                    channel.send(args.join(' ')).catch((a, b, c) => {
                        return errorMessage(message, `I failed`);
                    });
                }
            }
        }
    }
}