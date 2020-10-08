const { errorMessage, okMessage, warnMessage, infoMessage } = require('../modules/InfoMessage.js');
const { Message } = require('discord.js')

module.exports = {
    name: 'setting',
    adminOnly: true,
    description: 'Check or change a setting',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let client = message.client;
        let settingName = args.shift();
        let newValue = (args.length > 0) ? args.join(' ') : null;

        // if (args.length <= 0) { 
        //would be nice to have a detailed list of settings
        //     let settingsBody = ''
        //     for (const prop in client.settings) settingsBody += `${prop}\n`
        //     return infoMessage(message, settingsBody)
        // }

        if (client.settings[settingName] === undefined) return errorMessage(message, `There is no setting named ${settingName}`);

        if (newValue === null) {
            client.settings[settingName].val()
                .then(currentVal => infoMessage(message, `**${settingName}** === **${currentVal}**`))
                .catch(errorText => errorMessage(message, errorText));
        } else {
            client.settings[settingName].val(newValue)
                .then(() => okMessage(message, `**${settingName}** changed to **${newValue}**`))
                .catch(errorText => errorMessage(message, errorText));
        }
    }
}