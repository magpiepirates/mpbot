'use strict';

const { Message } = require('discord.js')

module.exports = {
    name: 'ban',
    adminOnly: true,
    description: 'Ban a user by ID. This is disabled.',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        return;
        message.channel.guild.members.ban(args[0]).then(r => {
            console.log(r);
        })
    }
}