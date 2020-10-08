'use strict';

const { MessageEmbed, Message } = require('discord.js');
const { errorMessage, okMessage, warnMessage } = require('../modules/InfoMessage.js');
const fs = require('fs');

module.exports = {
	name: 'storydump',
	adminOnly: false,
	description: 'Gets all posts froma channel as text separated by a space.',

	/**
	 * @param {Message} message 
	 * @param {String[]} args 
	 */
	async execute(message, args) {
		if (args[0] == 'help') {
			let helpMessage = new MessageEmbed();
			helpMessage.setTitle("storydump Help");
			helpMessage.setDescription(`Usage: **${message.client.prefix}storydump [channel] [messageID]**`)
			message.channel.send(helpMessage);
		} else {
			let givenName = args[0];
			let givenMessageID = args[1];

			if (args[0].substr(0, 1) == "#") givenName = args[0].substr(1);

			let channel = message.guild.channels.cache.find(c => c.type == 'text' && c.name == givenName);

			if (typeof channel == 'undefined') {
				errorMessage(message, `no channel found with name of ${givenName}`);
				return;
			} else {
				let startMessage;
				try {
					startMessage = await channel.messages.fetch(givenMessageID);
				}
				catch (error) {
					errorMessage(message, error);
					return;
				}

				if (typeof startMessage == 'undefined') {
					errorMessage(message, `no message found with ID of ${givenMessageID}`);
					return;
				} else {

					let theWords = await this.getTheMessages(channel, startMessage);

					let story = theWords.join(' ').replace(/(\s)+([\?\!\.])/g, "$2");
					let ch = 2000;
					fs.writeFile('story.txt', story, function (err) {
						if (err) return message.client.logger.log(err);
					});
					for (let i = 0; i < story.length; i += ch) {
						await message.author.send(story.substr(i, ch));
					}
				}
			}
		}

	},
	async getTheMessages(channel, startMessage) {
		let lastId = startMessage.id;
		let theWords = [];

		while (true) {
			const options = {
				limit: 50
			};

			if (lastId) {
				options.after = lastId;
			}

			let theseMessages;
			try {
				theseMessages = await channel.messages.fetch(options);
			}
			catch (error) {
				errorMessage(message, error);
				return;
			}

			theseMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
			theWords = theWords.concat(theseMessages.map(m => m.content));
			lastId = theseMessages.last().id;

			if (theseMessages.size != 50) break;
		}
		theWords.unshift(startMessage.content);
		return theWords;
	}
}