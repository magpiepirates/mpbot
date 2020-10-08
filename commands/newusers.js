const { MessageEmbed, Message } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: 'newusers',
    adminOnly: true,
    description: 'Shows a list of users that joined in the last 7 days',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let client = message.client;
        let days = 7;
        let newMembers = [];
        let newMessages = [];

        if (args.length > 0) {
            days = parseInt(args[0], 10);
        }

        let joinDate = moment().subtract(days, 'days');

        message.guild.members.fetch()
            .then(members => {
                function dateSort(a, b) {
                    if (a[1].joinedTimestamp > b[1].joinedTimestamp) return -1;
                    if (b[1].joinedTimestamp > a[1].joinedTimestamp) return 1;
                }
                let membersSorted = new Map([...members.entries()].sort(dateSort));

                membersSorted.forEach(member => {
                    let joinedDate = moment(parseInt(member.joinedTimestamp));
                    if (joinedDate.isAfter(joinDate)) {
                        let string = `**${member.user.username}** - *${joinedDate.format('MMM Do, YYYY')}*`;
                        //newMembers.push(member);
                        newMembers.push(string);
                    }
                });
            })
            .then(async () => {
                if (newMembers.length > 0) {
                    let nEmbeds = Math.ceil(newMembers.length / 36); //36 is the amount of 56 chars rows that will fit in one embed
                    console.log(newMembers.length, nEmbeds);
                    let index = 0;
                    for (let i = 0; i < nEmbeds; i++) {
                        let newMessage = new MessageEmbed();
                        let desc = '';
                        newMessage.setAuthor(client.user.username, client.user.avatarURL());
                        newMessage.setTitle(`New users in last ${days} days`);
                        newMessage.setColor(0x00ff00);
                        for (let j = 0; j < 36; j++) {
                            if (index >= newMembers.length) break;
                            desc += newMembers[index] + '\n';
                            index++;
                        }
                        newMessage.setDescription(desc);
                        newMessages.push(newMessage);
                    }
                } else {
                    let newMessage = new MessageEmbed();
                    newMessage.setAuthor(client.user.username, client.user.avatarURL());
                    newMessage.setTitle(`New users in last ${days} days`);
                    newMessage.setDescription('No new users :(');
                    newMessage.setColor(0x00ff00);
                    newMessages.push(newMessage);
                }
                for (let embed of newMessages) {
                    try {
                        await message.channel.send(embed);
                    } catch (err) {
                        message.client.logger.log(err);
                    }
                }
            })
            .catch(err => {
                message.client.logger.log(err);
            });
    }
}