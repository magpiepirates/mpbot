const { Message } = require('discord.js')

module.exports = {
    name: 'getuser',
    adminOnly: true,
    description: 'Gives you the name of the user that was the nth to join',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let client = message.client;
        let newMembers = [];

        let position;

        if (args.length > 0) {
            position = parseInt(args[0], 10);
            if (position <= 0) return errorMessage(message, `Error: <position> must be greater than 0`);
            position -= 1;
        } else return errorMessage(message, `Usage: ${client.prefix}getuser <position>`)

        message.guild.members.fetch()
            .then(members => {
                function dateSort(a, b) {
                    if (a.joinedTimestamp < b.joinedTimestamp) return -1;
                    if (b.joinedTimestamp < a.joinedTimestamp) return 1;
                }
                let membersArr = members.array().sort(dateSort)
                let len = membersArr.length;
                let dumbInfo = '';
                if (position > len) {
                    dumbInfo = ` (I know... you inputted ${position + 1}, but apparently we don't have that many users in here...)`
                    position = len - 1;

                }

                let member = membersArr[position];

                return message.channel.send(`User number ${position + 1}${dumbInfo} is... **${member.user.username}**! Are you happy now, daddy magpie?`)
            })
            .catch(err => {
                message.client.logger.log(err);
            });
    }
}