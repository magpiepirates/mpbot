'use strict';

const { argv } = require('yargs');
const fs = require('fs');
const { randomDM } = require('./modules/RandomWord.js');
const Discord = require('discord.js');
const bc = require('./modules/bcscraper.js')
const CollabDrive = require('./modules/drive.js');
const BotSettings = require('./BotSettings.js');
const Logger = require('./modules/Logger.js');
const MDBSchema = require('./schema.js')
const mongoose = require('mongoose')

const mongoCreds = require('./creds/mongo.json')
const tokens = require('./creds/tokens.json')

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.mongoose = mongoose

client.prefix = '??'
if (argv.prefix) client.prefix = argv.prefix;

client.commands = new Discord.Collection();

//bot wide functions 
client.isAdmin = function (member) {
	return typeof member.roles.cache.find(r => r.id === client.settings.role.qm) != 'undefined' || member.hasPermission('ADMINISTRATOR');
}
//end bot wide functions

client.all = new Discord.Collection();
client.drive = new CollabDrive();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const allFiles = fs.readdirSync('./all').filter(file => file.endsWith('.js'));

for (const file of allFiles) {
	const unit = require(`./all/${file}`);
	client.all.set(unit.name, unit);
}

client.once('ready', async () => {
	try {
		let productionMode = true;
		let status = '';

		await mongoose.connect(mongoCreds.connStr, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			user: mongoCreds.user,
			pass: mongoCreds.password,
			dbName: 'mp'
		})

		console.log("[mongoose] connected");

		mongoose.model('DbSettingModel', MDBSchema.DbSettingSchema, 'botSettings')
		mongoose.model('UploadRequestModel', MDBSchema.UploadRequest, 'uploadrequests')
		mongoose.model('CollabModel', MDBSchema.CollabSchema, 'collabs')
		mongoose.model('TralbumModel', MDBSchema.TralbumSchema, 'bc-list')
		mongoose.model('MemberModel', MDBSchema.MemberSchema, 'members')
		mongoose.model('CoverArtModel', MDBSchema.CoverArtSchema, 'cover-art')
		mongoose.model('CoverArtVoteModel', MDBSchema.CoverArtVoteSchema, 'cover-art-votes')
		mongoose.model('PirateThingModel', MDBSchema.PirateThingSchema, 'piratething')

		//Create collections, if they don't exist, for the defined models
		for (const model in mongoose.models) {
			let curModel = mongoose.models[model]
			curModel.createCollection()
				.then(() => console.log(`[mongoose] collection ${curModel.collection.name} created`))
				.catch(e => {
					if (e.code === 48) console.log(`[mongoose] collection ${curModel.collection.name} already exists`)
					else console.error(e)
				})
		}


		if (argv.token !== 'main') productionMode = false;


		if (productionMode) {
			client.settings = new BotSettings(1, mongoose.models.DbSettingModel);
			let botLogChannelID = await client.settings.channelBotLogProduction.val()
			client.channels.cache.get(botLogChannelID);
			status = "Beep Booping";
			console.log('[mode] PRODUCTION');

		} else {
			client.settings = new BotSettings(2, mongoose.models.DbSettingModel);
			let botLogChannelID = await client.settings.channelBotLogDev.val()
			client.channels.cache.get(botLogChannelID)
			status = `${client.prefix} TEST MODE`
			console.log('[mode] TEST');
		}

		client.logger = new Logger(client);

		//Functions for the Bandcamp and radio thing
		let radioChannel = client.channels.cache.find((c) => c.id === client.settings.channel.radio)
		let radioText = client.channels.cache.find((c) => c.id === client.settings.channel.radioText)
		/**
		 * 
		 * @param {mongoose.Model} model
		 */
		const getRandomTrack = (model) => {
			let embed = new Discord.MessageEmbed();
			model.find({}).exec()
				.then((res) => {
					let index = Math.round(Math.random() * (res.length - 1))
					let track = res[index]
					if (track.type === 'track') {
						embed.setTitle(track.title)
						embed.setURL(track.url)
						embed.setFooter('Enjoy!')
						return bc.getMP3(track.url)
					} else {
						index = Math.round(Math.random() * (track.tracklist.length - 1))
						let t = track.tracklist[index];
						embed.setTitle(t.title)
						embed.setURL(t.url)
						embed.setDescription(`From ${track.title}`)
						embed.setFooter('Enjoy!')
						return bc.getMP3(t.url)
					}
				})
				.then(mp3 => {
					client.dispatcher = client.connection.play(mp3)
					client.dispatcher.on('finish', () => getRandomTrack(model))
					client.dispatcher.on('error', console.error)
					radioText.send(embed)
				})
		}

		await bc.updateTrackList(mongoose.models.TralbumModel)
			.catch(console.error)

		radioChannel.join()
			.then(connection => {
				client.connection = connection;
				return getRandomTrack(mongoose.models.TralbumModel)
			})
			.then(() => console.log('[radio] started'))
			.catch(console.error)

		client.user.setActivity(status, { type: "PLAYING" });
	} catch (e) {
		console.error(e)
	}
});

client.on('guildMemberAdd', member => {
	mongoose.models.MemberModel.updateOne({
		userID: member.user.id
	}, {
		$set: {
			userID: member.user.id,
			firstMentionedByID: null,
			dateJoined: Date.now(),
			mentioned: 0
		}
	}, { upsert: true }).exec()
		.then(() => client.logger.log(`New user: ${member.user.username}`))
		.catch(console.error)
});

client.on('messageDelete', (message) => {
	if (client.settings.inputChannels.includes(message.channel.id)) {
		mongoose.models.CoverArtModel.updateOne({ 'covers.imageID': message.id }, { $pull: { covers: { imageID: message.id } } }).exec()
			.then(res => {
				if (res.n > 0 && res.nModified > 0) return mongoose.models.CoverArtModel.findOneAndDelete({ image: message.id });
			})
			.catch(console.error)
	}

});

client.on('message', message => {
	if (message.author === client.user) return; //message.author === client.user => PLEASE FOR THE LOVE OF GOD ALWAYS CHECK THAT THE MESSAGE ISN'T SENT BY THE BOT

	if (message.channel instanceof Discord.DMChannel) {
		message.reply(`${randomDM()}`)
		return;
	}

	try {
		let messageAll = client.all.get('message');
		messageAll.execute(message);
	}
	catch (error) {
		client.logger.log(error);
	}

	if (!message.content.startsWith(client.prefix)) return;

	if (client.settings.inputChannels.length > 0 && !client.settings.inputChannels.find(id => id === message.channel.id)) return;

	let args = message.content.substr(client.prefix.length).split(/ +/);
	let command = args.shift();

	if (!client.commands.has(command)) return;

	try {
		let cmd = client.commands.get(command);
		if (!message.client.isAdmin(message.member) && cmd.adminOnly) return message.reply("you must be an admin.");
		else cmd.execute(message, args);
	}
	catch (error) {
		let name = (Math.random() < 0.5) ? 'DDC' : 'AnalogWeapon';
		console.error(error);
		message.reply(`Ah shit. MagpieBot did error. It's all ${name}'s fault.`);
	}

});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.message.partial) await reaction.message.fetch().catch(console.error);
	if (user.partial) await user.fetch().catch(console.error);

	let emoji = reaction.emoji.toString();
	let channel = reaction.message.channel;

	if (channel.parent.id === client.settings.category.collab) {
		if (emoji === client.settings.emojiAdd) {
			mongoose.models.CollabModel.findOne({ channelID: reaction.message.channel.id, messageID: reaction.message.id }).exec()
				.then(res => {
					if (res !== null) {
						let roleID = res.roleID;
						let guildUser = reaction.message.guild.members.cache.find(guildMember => guildMember.user === user);
						let role = reaction.message.guild.roles.cache.find(r => r.id === roleID);
						return guildUser.roles.add(role)
					}
				})
				.catch(console.error)
		}
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.message.partial) await reaction.message.fetch().catch(console.error);
	if (user.partial) await user.fetch().catch(console.error);

	let emoji = reaction.emoji.toString();
	let channel = reaction.message.channel;

	if (channel.parent.id === client.settings.category.collab) {
		if (emoji === client.settings.emojiAdd) {
			mongoose.models.CollabModel.findOne({ channelID: reaction.message.channel.id, messageID: reaction.message.id }).exec()
				.then(res => {
					if (res !== null) {
						let roleID = res.roleID;
						let guildUser = reaction.message.guild.members.cache.find(guildMember => guildMember.user === user);
						let role = reaction.message.guild.roles.cache.find(r => r.id === roleID);
						return guildUser.roles.remove(role)
					}
				})
				.catch(console.error)
		}
	}
});

let token = tokens[argv.token]
console.log(`[login] logging in as ${argv.token}`)
client.login(token)
