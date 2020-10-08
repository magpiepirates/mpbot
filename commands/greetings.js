'use strict';

const { okMessage, errorMessage, warnMessage } = require('../modules/InfoMessage.js');
const { MessageEmbed, Message } = require('discord.js');

module.exports = {
	name: 'greetings',
	adminOnly: true,
	description: 'Manage greetings for new users',

	/**
	 * @param {Message} message 
	 * @param {String[]} args 
	 */
	async execute(message, args) {
		let command = args.shift();
		let client = message.client;
		let greeting = undefined;

		switch (command) {
			case ('add'): {
				let greeting = args.join(' ');
				if (greeting.search('%u') == -1) {
					return errorMessage(message, "You have to include `%u` in the greeting to mention the new user!");
				} else {
					client.db.add('greetings', {
						value: greeting
					});
					return okMessage(message, "Greeting added!");
				}
				break;
			}
			case ('delete'): {

			}
			default: {
				const pageSize = 10;
				const maybeNum = (typeof command != 'undefined') ? parseInt(command.replace(/[^0-9]/g, '')) : 0;
				const pageNumber = (maybeNum > 0) ? maybeNum : 1;
				const pageStart = (pageSize * pageNumber) - pageSize;
				let page = new MessageEmbed();
				let description = '';

				await client.db.find('greetings', {}, {
					sort: { _id: 1 }
				})
					.then((allGreetings) => {
						if (allGreetings.length == 0) throw new Error('No geetings returned');

						let totalPages = Math.ceil(allGreetings.length / pageSize);

						page.setTitle(`Greetings (${pageNumber} of ${totalPages}) ${testv}`);
						testv += 1;
						let greetPage = allGreetings.slice(pageStart, pageStart + pageSize);

						greetPage.forEach((g, i) => {
							description += `${i} ${g.value}\n`;
						});

						page.setDescription(description);
						message.channel.send(page);
					})
					.catch(err => client.logger.log(err));

			}
		}

	}
}