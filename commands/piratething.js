const { MessageEmbed, Message } = require('discord.js');
const { okMessage, errorMessage, infoMessage, warnMessage } = require('../modules/InfoMessage.js');
const https = require('https');
const http = require('http');
const { Model } = require('mongoose');

module.exports = {
	name: 'piratething',
	adminOnly: false,
	description: 'Get a random pirate thing',

	/**
	 * @param {Message} message 
	 * @param {String[]} args 
	 */
	async execute(message, args) {
		/** @type {Model} */
		let model = message.client.mongoose.models.PirateThingModel
		let notAdmin = !message.member.roles.cache.find(r => r.id === message.client.settings.role.qm);

		if (args.length == 0) {
			let things = await model.find({ cleared: true });
			let rnd = Math.round(Math.random() * (things.length - 1));
			message.channel.send(things[rnd].url);
		}

		else {
			let command = args.shift()
			switch (command) {

				case 'submit': {
					if (args.length <= 0) return errorMessage(message, "You need to provide a URL")
					let contentUrl = args.shift()
					if (!contentUrl.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
						return errorMessage(message, "That's not a valid URL");
					} else {
						model.create({
							url: contentUrl,
							submitter: message.author.username,
							cleared: !notAdmin
						})
							.then(() => okMessage(message, 'Pirate thing added. When it is cleared by a QM, it will be available as a random pirate thing.'))
							.catch(err => {
								console.error(err)
								errorMessage(message, err.message)
							})
					}
					break;
				}

				case 'review': {
					let things = [];
					try {
						things = await model.find({ cleared: false });
						if (things.length == 0) {
							return infoMessage(message, 'No new things');
						} else {
							things.forEach(thing => {
								let embed = new MessageEmbed();
								let protocolHandler = (thing.url.substring(0, 5) == 'https') ? https : http;
								protocolHandler.get(thing.url, function (res) {
									if (res.headers['content-type'].match('image')) {
										embed.setTitle(thing.submitter);
										embed.setImage(thing.url);
										message.channel.send(embed);
									}
									else message.channel.send(`**${thing.submitter}** ${thing.url}`);

								});

							});
						}
					} catch (e) {
						console.error(e)
						errorMessage(message, e.message)
					}
					break;
				}

				case 'accept': {
					args.shift();
					try {
						if (args.length == 0) {
							r = await model.updateMany({ cleared: false }, { $set: { cleared: true } });
							okMessage(message, 'All things cleared');
						} else {
							r = await model.updateOne({ url: args[0] }, { $set: { cleared: true } });
							okMessage(message, 'Cleared that thing');
						}
					} catch (e) {
						console.error(e)
						errorMessage(message, e.message)
					}
					break;
				}

				case 'help': {
					let helpMessage = new MessageEmbed();
					helpMessage.setTitle("Piratething Help");
					helpMessage.setDescription(`Usage: \`${message.client.prefix}piratething [command] [argument]\``)
					helpMessage.addField(`\`${message.client.prefix}piratething\``, "Gets a random pirate thing (URL)");
					helpMessage.addField(`\`${message.client.prefix}piratething submit <url>\``, "Submit a new pirate thing (In the form of a URL) for consideration");
					if (isAdmin) {
						helpMessage.addField(`\`${message.client.prefix}piratething review\``, "Show a list of links submitted that haven't been accepted yet");
						helpMessage.addField(`\`${message.client.prefix}piratething accept {all|<url>}\``, "Accept all new links or one link by URL");
					}
					message.channel.send(helpMessage);
					break;
				}

			}

		}

	}

}