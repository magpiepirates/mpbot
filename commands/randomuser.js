'use strict';
const { Message } = require('discord.js')

module.exports = {
    name: 'randomuser',
    adminOnly: false,
    description: 'Gets a random member\'s username',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let output = 'members:\n';
        message.guild.members.fetch();
        let list = message.guild.members.cache.array();

        let index = Math.floor(Math.random() * list.length);

        if (args[0] === 'ping' && message.member.hasPermission('ADMINISTRATOR')) message.reply("here's your random user: " + list[index].toString());

        else message.reply("here's your random user: " + list[index].user.username);
    }
}