const moment = require('moment');
const Discord = require('discord.js')

// Logs to log channel. call with <client>.logger.log()

class Logger {
    /**
     * Creates a Logger object, used to log useful information in the "bot-log" channel
     * @param {Discord.Client} client
     */
    constructor(client) {
        this.client = client;
        this.logChannel = null;
        this.initialize();
    }

    /**
     * Initializes the logChannel property
     */
    async initialize() {
        let logChannelID;
        if (this.client.settings.mode === 1) {
            logChannelID = await this.client.settings.channelBotLogProduction.val();
        } else if (this.client.settings.mode == 2) {
            logChannelID = await this.client.settings.channelBotLogDev.val();
        } else {
            throw new Error("Logger couldn't initialize. No valid run mode");
        }
        this.logChannel = this.client.channels.cache.get(logChannelID);
    }
    /**
     * Logs the given info to both the log channel and the console
     */
    log() {
        if (arguments.length == 0) return;
        console.log(arguments);
        if (this.logChannel != null) {
            let logMessage = '```json\n';
            for (let i = 0; i < arguments.length; i++) {
                logMessage += `${JSON.stringify(arguments[i], null, 4)}\n\n`;
            }
            this.logChannel.send(moment(Date.now()).format('YYYY-MM-DD HH:mm:ss.SSS') + logMessage + '```');
        }
    }
}

module.exports = Logger;