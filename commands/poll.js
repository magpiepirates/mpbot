'use strict';

const Poll = require('../modules/Poll.js');
const { MessageEmbed, Message } = require('discord.js');
const { errorMessage, okMessage, warnMessage } = require('../modules/InfoMessage.js');

/** @type {Poll[]} */
let polls = [];

module.exports = {
    name: 'poll',
    adminOnly: true,
    description: 'Creates a poll! You can choose which channel to publish the poll to!',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        /** @type {Poll} */
        let poll = undefined;

        if (polls.length > 0) {                                                  //if the poll array isn't empty...
            polls = polls.filter(p => !p.expired);                        //removes expired polls
            poll = polls.find(p => p.author === message.author);            //if the user already is working on a poll, retrieve that poll
        }

        let command = args.shift();

        switch (command) {
            case 'create': {
                let title = args.join(' ');
                if (!title) return errorMessage(message, 'You must specify a title for the poll!');

                if (poll === undefined) {                                            //if the user isn't working on a poll, make a new one.
                    poll = new Poll({
                        author: message.author,
                        name: 'Poll: ' + title,
                        creationChannel: message.channel
                    });
                    polls.push(poll);
                }


                poll.setTitle(`Poll: ${title}`);
                okMessage(message, `Title set to *${title}*. You have 20 minutes to complete the poll.`);
                break;
            }

            case 'add': {
                if (poll === undefined) return warnMessage(message, `Please, use **${message.client.prefix}poll create [title]** first!`);

                let opt = args.join(' ');
                if (!opt) return errorMessage(message, 'You cannot add an empty option! At least in this way....');
                poll.addOption(opt);
                okMessage(message, `"${opt}" added to the options!`);
                break;
            }

            case 'destroy': {
                if (poll === undefined) return warnMessage(message, "You weren't working on a poll");
                polls = polls.filter(p => p !== poll);
                poll.cancelTimeout();
                okMessage(message, "Poll destroyed.")
                break;
            }

            case 'del': {
                if (poll === undefined) return warnMessage(message, `Please, use **${message.client.prefix}poll create [title]** first!`);
                let index = parseInt(args[0]);
                if (isNaN(index)) return errorMessage(message, "You didn't input a number");
                if (index <= 0 || index > poll.pollOpts.length) return errorMessage(message, `The option doesn't exist`);
                poll.removeOption(index - 1);
                okMessage(message, `Option number ${index} removed!`);
                break;
            }

            case 'preview': {
                if (poll === undefined) return warnMessage(message, `Please, use **${message.client.prefix}poll create [title]** first!`);
                poll.publish(message.channel)
                break;
            }

            case 'publish': {
                if (poll === undefined) return warnMessage(message, `Please, use **${message.client.prefix}poll create [title]** first!`);
                if (poll.pollOpts.length <= 0) return errorMessage(message, `You can't send a poll without options!`);
                let channelName = args.join('-');
                let channel = message.guild.channels.cache.find(c => c.name === channelName);

                if (channel) poll.publish(channel);
                else return errorMessage(message, `I couldn't find ${channelName}!`);

                okMessage(message, `Poll published in ${channel.toString()}`);
                polls = polls.filter(p => p !== poll);
                poll.cancelTimeout();
                break;
            }

            case 'help': {
                let helpMessage = new MessageEmbed();
                helpMessage.setTitle("Poll Help");
                helpMessage.setDescription(`Usage: **${message.client.prefix}poll [command] [argument]**`)
                helpMessage.addField("create *[title]*", "Creates a poll titled *[title]*");
                helpMessage.addField("add *[option]*", "Adds an option to the poll");
                helpMessage.addField("del *[number]*", "Deletes an option based on the given number");
                helpMessage.addField("preview", "Shows a preview of the poll");
                helpMessage.addField("destroy", "Cancels the poll creation");
                helpMessage.addField("publish *[channel name]*", "Publishes the poll in the given channel");
                message.channel.send(helpMessage);
                break;
            }

            default: {
                errorMessage(message, `Unknown command. Use ${message.client.prefix}poll **help** to get a list of available commands.`);
                break;
            }

        }
    }
}