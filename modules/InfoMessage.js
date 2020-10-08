const Discord = require('discord.js');

module.exports = {
    /**
     * Sends an error message to the user
     * @param {Discord.Message} message - message of the command that initialized this
     * @param {String} info 
     */
    errorMessage(message, info) {
        let embed = new Discord.MessageEmbed();
        embed.setDescription(`❌ ${info}`);
        embed.setColor(message.client.settings.errorColor);
        //embed.setFooter('Oopsie!');
        message.channel.send(embed)
            .catch(e => console.error(e));
    },

    /**
     * Sends an OK message to the user
     * @param {Discord.Message} message - message of the command that initialized this
     * @param {String} info 
     */
    okMessage(message, info) {
        let embed = new Discord.MessageEmbed();
        embed.setDescription(`✅ ${info}`);
        embed.setColor(message.client.settings.okColor);
        //embed.setFooter('Yay!');
        message.channel.send(embed)
            .catch(e => console.error(e));
    },

    /**
     * Sends an informative message to the user
     * @param {Discord.Message} message - message of the command that initialized this
     * @param {String} info 
     */
    infoMessage(message, info) {
        let embed = new Discord.MessageEmbed();
        embed.setDescription(`ℹ️ ${info}`);
        embed.setColor(message.client.settings.infoColor);
        //embed.setFooter('Yay!');
        message.channel.send(embed)
            .catch(e => console.error(e));
    },

    /**
     * Sends an warning message to the user
     * @param {Discord.Message} message - message of the command that initialized this
     * @param {String} info 
     */
    warnMessage(message, info) {
        let embed = new Discord.MessageEmbed();
        embed.setDescription(`⚠️ ${info}`);
        embed.setColor(message.client.settings.warnColor);
        //embed.setFooter('Yay!');
        message.channel.send(embed)
            .catch(e => console.error(e));
    }

};