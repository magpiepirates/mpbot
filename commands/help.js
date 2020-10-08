const { MessageEmbed, Message } = require('discord.js');

module.exports = {
    name: 'help',
    adminOnly: false,
    description: 'Shows this message.',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let helpMessage = new MessageEmbed();
        let client = message.client;

        helpMessage.setAuthor(client.user.username, client.user.avatarURL());
        helpMessage.setTitle('Help Message');
        helpMessage.setColor(0x00ff00);

        client.commands.forEach((cmd) => {
            if (cmd.adminOnly && !message.member.roles.cache.find(r => r.id === client.settings.role.qm || r.id === client.roleDM)) return;
            helpMessage.addField(client.prefix + cmd.name, cmd.description)
        });
        message.channel.send(helpMessage);
    }
}