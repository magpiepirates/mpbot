'use strict';

const { okMessage, warnMessage, errorMessage } = require('../modules/InfoMessage.js');
const { MessageEmbed, Message } = require('discord.js');
const expiration = 600000;
const sha256 = require('js-sha256');
const { Model } = require('mongoose');

let hn = 'tools.magpiepirates.com';
//let hn = "localhost:3000"

module.exports = {
    name: 'upload',
    adminOnly: false,
    description: 'WIP',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {

        let opt = args.shift();

        /** @type {Model} */
        let modelCover = message.client.mongoose.models.CoverArtModel
        /** @type {Model} */
        let modelCollab = message.client.mongoose.models.CollabModel
        /** @type {Model} */
        let modelUpReq = message.client.mongoose.models.UploadRequestModel

        switch (opt) {
            case 'track': {
                warnMessage(message, `Sorry, we changed a bunch of things, so you now need to post **${message.client.prefix}upload collab [collab name]** -DDC`);
                break;
            }

            case 'collab': {
                if (args.length <= 0) return warnMessage(message, 'You must specify the name of the channel related to the collab!');
                let channelName = args.join('-').toLowerCase();
                let channel = message.guild.channels.cache.find(c => c.type === 'text' && c.name === channelName);

                if (!channel) return errorMessage(message, "That channel doesn't exist!")

                let ts = Date.now();
                let token = sha256((parseInt(message.author.id, 10) + ts + parseInt(channel.id, 10)).toString());

                modelUpReq.findOne({ userID: message.author.id, channelID: channel.id }).exec()
                    .then(result => {
                        if (result === null) return modelCollab.findOne({ channelID: channel.id }).exec();
                        else if (Date.now() - result.ts > expiration) {
                            return modelUpReq.findOneAndDelete({ userID: message.author.id, channelID: channel.id }).exec()
                                .then(() => modelCollab.findOne({ channelID: channel.id }).exec())
                        }
                        else throw new Error('TOKEN_EXISTS');
                    })
                    .then(collabData => {
                        if (collabData === null) throw new Error('INVALID_COLLAB');
                        else {
                            let uploadRequest = {
                                ts: ts,
                                token: token,
                                channelID: channel.id,
                                username: message.author.username,
                                userID: message.author.id
                            };
                            return modelUpReq.create(uploadRequest);
                        }
                    })
                    .then((data) => message.author.createDM())
                    .then(dmChannel => dmChannel.send(`Follow this link to upload your track:\n http://${hn}/collabsubmit?token=${token}&cid=${channel.id}`))
                    .catch(error => {
                        let msg = error.message;
                        if (msg === 'TOKEN_EXISTS') errorMessage(message, 'You already have a token!');
                        else if (msg === 'INVALID_COLLAB') errorMessage(message, "That channel isn't linked to any collab!");
                        else if (error.code === 50007) message.reply(`I couldn't DM you :(\nFollow this link to upload your track:\nhttp://${hn}/collabsubmit?token=${token}&cid=${channel.id}`);
                        else console.error(error);
                        message.client.logger.log(err);
                    });
                break;
            }

            case 'cover': {
                if (args.length <= 0) return warnMessage(message, 'You must specify the name of the channel related to the collab!');
                let channelName = args.join('-').toLowerCase();
                let channel = message.guild.channels.cache.find(c => c.type === 'text' && c.name === channelName);
                if (message.attachments.size <= 0) return errorMessage(message, 'You must use this command in the caption of an image attachment!');
                let image = message.attachments.first();

                if (!image.name.match(/(jpg|jpeg|png|gif)+/gi)) return errorMessage(message, 'Attachment must be an image! (GIF, JPG or PNG');

                if (image.height !== image.width || image.height < 1400 || image.width < 1400) return errorMessage(message, "Image must be at least 1400px by 1400px. The aspect ratio must also be 1:1");

                modelCollab.findOne({ channelID: channel.id }).exec()
                    .then((collabData) => {
                        if (collabData === null) throw new Error("INVALID_COLLAB");
                        else return modelCover.findOne({ channelID: channel.id }).exec() //collab is valid                        
                    })
                    .then((coverSubmissions) => {
                        let coverArt = {
                            channelID: channel.id,
                            channelName: channelName,
                            covers: []
                        }

                        let cover = {
                            imageID: message.id,
                            link: image.url
                        }
                        if (coverSubmissions === null) {
                            coverArt.covers.push(cover);
                            return modelCover.create(coverArt);
                        } else return modelCover.updateOne({ channelID: channel.id }, { $push: { covers: cover } }).exec()
                    })
                    .then(() => okMessage(message, `Thanks for the submission! To remove your submission, delete the message you just sent! Visit http://tools.magpiepirates.com/coverpoll?cid=${channel.id} to vote for cover art!`))
                    .catch((error) => {
                        let msg = error.message;
                        if (msg === 'INVALID_COLLAB') return errorMessage(message, "That channel isn't linked to any collab!")
                        message.client.logger.log(err);
                    });
                break;
            }

            case 'help': {
                let helpMessage = new MessageEmbed();
                helpMessage.setTitle("Upload Help");
                helpMessage.setDescription(`Usage: **${message.client.prefix}upload [command] [argument]**`)
                helpMessage.addField("collab *[collab name]*", "Creates a link to the upload form for *[collab name]* collab. You may request only one link per collab, and it's valid for 10 minutes. The bot will try to DM you, but if it can't, it'll send the link to you in the channel you request it from.");
                helpMessage.addField("cover *[collab name]*", "Includes your submission in the cover art poll for *[collab name]* collab. **USE THIS COMMAND AS THE CAPTION OF A PICTURE**");
                message.channel.send(helpMessage);
                break;
            }

            default: {
                errorMessage(message, `Unknown command. Use ${message.client.prefix}upload **help** to get a list of available commands.`);
                break;
            }
        }
    }
}