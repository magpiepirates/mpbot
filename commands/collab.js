'use strict';

const Collab = require('../modules/Collab.js');
const { okMessage, errorMessage, warnMessage } = require('../modules/InfoMessage.js');
const { MessageEmbed, Message } = require('discord.js');
const moment = require('moment')
const { Model } = require('mongoose')
/**
 * @type {Collab[]}
 */
let collabs = [];

module.exports = {
    name: 'collab',
    adminOnly: true,
    description: 'Start a collab. This creates a channel and a role, and it sends the usual description message as the first entry to the channel.',
    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        let client = message.client;
        /** @type {Model} */
        let modelCollab = client.mongoose.models.CollabModel
        /** @type {Model} */
        let modelCover = client.mongoose.models.CoverArtModel
        /** @type {Model} */
        let modelCoverVotes = client.mongoose.models.CoverArtVoteModel
        /** @type {Collab} */
        let collab = undefined;

        if (collabs.length > 0) {                                                       //if the collab array isn't empty...
            collabs = collabs.filter(p => !p.expired);                                  //removes expired collabs
            collab = collabs.filter(p => p.author === message.author)[0];               //if the user already is working on a collab, retrieve that collab
        }

        let command = args.shift();

        switch (command) {

            case 'create': {
                let name = args.join('-');  //use normal discord formatting
                if (!name) return errorMessage(message, "You must specify a name!");
                if (collab === undefined) {

                    collab = new Collab({
                        author: message.author,
                        name: name,
                        creationChannel: message.channel
                    });

                    collabs.push(collab);
                }
                okMessage(message, `Collab "${collab.name}" created!`);
                break;
            }

            case 'preview': {
                if (collab === undefined) return warnMessage(message, `Please, use **${client.prefix}collab create [title]** first!`);
                //collab.setDescription(args.join(' '));
                collab.showEmbed(message);
                break;
            }


            case 'description': {
                if (collab === undefined) return warnMessage(message, `Please, use **${client.prefix}collab create [title]** first!`);
                collab.setDescription(args.join(' '));
                okMessage(message, `Description set!`);
                //collab.showEmbed(message);
                break;
            }

            case 'type': {
                let type = args.shift();
                try {
                    collab.setType(type);
                    okMessage(message, `Collab type set to ${type}!`)
                } catch (err) {
                    errorMessage(message, err.message);
                    client.logger.log(err);
                }
                break;
            }

            case 'due': {
                if (collab === undefined) return warnMessage(message, `Please, use **${client.prefix}collab create [title]** first!`);
                collab.setDueDate(args.join(' '));
                okMessage(message, `Due date set!`);
                //collab.showEmbed(message);
                break;
            }

            case 'publish': {
                if (collab === undefined) return warnMessage(message, `Please, use **${client.prefix}collab create [title]** first!`);
                if (collab.type === undefined) return warnMessage(message, `You must specify a collab type first! Please, use **${client.prefix}collab type [type]**!`)
                collab.publish(message)
                    .then(() => {
                        okMessage(message, "Collab published!");
                    })
                    .catch(err => {
                        if (err.message === 'CHANNEL_ALREADY_COLLAB') errorMessage(message, 'The channel is already a valid collab');
                        client.logger.log(err);
                    });
                collabs = collabs.filter(c => c !== collab);
                collab.cancelTimeout();
                break;
            }

            case 'abort': {
                if (collab === undefined) return warnMessage(message, `You weren't working on a collab!`);
                collabs = collabs.filter(c => c !== collab);
                collab.cancelTimeout();
                okMessage(message, "Collab aborted. Bye Bye!")
                break;
            }

            case 'archive': {
                let channelName = args.join('-');
                if (!channelName) return errorMessage(message, "You must specify a channel!");

                let channel = message.guild.channels.cache.find(c => c.type === 'text' && c.name === channelName && c.parent.id === client.settings.category.collab);
                if (!channel) return errorMessage(message, "The channel you specified isn't a collab channel or doesn't exist!");

                let archive = message.guild.channels.cache.find(c => c.type === 'category' && c.id === client.settings.category.archive);

                if (archive.children.size >= 50) return errorMessage(message, "No available space in the archive!");

                channel.setParent(archive)
                    .then((guildChannel) => modelCollab.findOneAndDelete({ channelID: guildChannel.id }).exec())
                    .then((res) => {
                        if (res === null) throw new Error(`Couldn't find ${channelName} collab in the Database. This might require to delete manually the Collab Role.`)
                        let roleID = res.roleID;
                        channelName = res.channelName; //fix for eventual change of channel name. Rely on what the DB says.
                        let deleteRole = message.guild.roles.cache.find(role => role.id === roleID);
                        return deleteRole.delete('Collab archived')
                    })
                    .then(() => client.drive.deleteCollabFolder(channelName))
                    .then(() => modelCover.deleteMany({ channelID: channel.id }).exec())
                    .then(() => modelCoverVotes.deleteMany({ channelID: channel.id }).exec())
                    .then(() => okMessage(message, `${channel} archived correctly!`))
                    .catch((err) => {
                        errorMessage(message, err.message);
                        client.logger.log(err);
                    });

                break;
            }

            case 'covers': {
                if (args.length == 0) {
                    return errorMessage(message, "First argument must by the collab name!");
                } else {
                    let collabName = args[0];
                    let collabChannel = message.guild.channels.cache.find(c => c.type === 'text' && c.name === collabName && c.parent.id === client.settings.category.collab);
                    let collabData;

                    if (!collabChannel) return errorMessage(message, `"${collabName}" isn't a collab name that I know!`);

                    modelCollab.findOne({ channelID: collabChannel.id }).exec()
                        .then(cData => {
                            if (cData === null) throw new Error("INVALID_COLLAB");
                            collabData = cData;
                            return modelCover.findOne({ channelID: collabChannel.id }).exec()
                        }).then(coverSubmissions => {
                            let pollLink = `http://tools.magpiepirates.com/coverpoll?cid=${collabChannel.id}`;

                            if (args[1] == 'publish') {

                                collabChannel.send(`<@&${collabData.roleID}> Vote for cover art!\n\n${pollLink}`)
                                    .then(() => okMessage(message, `Poll published to #${collabName}!`));

                            } else {

                                let coversMessage = new MessageEmbed();

                                coversMessage.setTitle(`Cover art submissions for ${collabName}`);
                                coversMessage.setURL(pollLink);
                                coversMessage.setDescription(`Title links to poll. To publish this cover art poll to the collab channel:\n\`??collab covers ${collabName} publish\``);

                                message.channel.send(coversMessage);

                                coverSubmissions.covers.forEach(coverData => {
                                    message.channel.send(coverData.link);
                                });

                            }

                        });

                }

                break;
            }

            case 'help': {
                let helpMessage = new MessageEmbed();
                helpMessage.setTitle("Collab Help");
                helpMessage.setDescription(`Usage: **${client.prefix}collab [command] [argument]**`)
                helpMessage.addField("create *[title]*", "Creates a collab titled *[title]*. This will be the channel name and the role name");
                helpMessage.addField("description *[description]*", "Sets the description of the collab");
                helpMessage.addField("preview", "Shows a preview of what you have so far");
                helpMessage.addField("due *[date]*", "Sets the deadline");
                helpMessage.addField("abort", "Cancels the collab creation");
                helpMessage.addField("publish", "Creates the channel in the collab category, and creates the role to be assigned to people willing to join the collab");
                helpMessage.addField("archive *[collab channel]*", "Puts the collab in the Purge category. It also deletes the Collab Role");
                helpMessage.addField("covers *[collab channel]*", "Shows cover art submissions and link to poll");
                helpMessage.addField("covers *[collab channel]* publish", "Publishes cover art poll to collab channel and mentions collab role.");
                message.channel.send(helpMessage);
                break;
            }

            default: {
                errorMessage(message, `Unknown command. Use ${client.prefix}collab **help** to get a list of available commands.`);
                break;
            }
        }
    }
}