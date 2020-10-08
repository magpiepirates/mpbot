const { Message, TextChannel } = require('discord.js');
const { Model } = require('mongoose');
const builder = require('./_builder.js');
/**
 * Creates a new Collab object
 * @class
 */
class Collab extends builder {
    /**
     * @extends builder
     */
    constructor(obj) {
        obj.type = 'collab';
        super(obj);
        this.options = {
            type: 'text',
            topic: 'Check the pinned messages!',
            nsfw: false,
            parent: undefined,
            reason: 'New Collab'
        };
    }
    /**
     * Sets the Due Date of this collab. Currently, this property is only used for display for the end user, so it's not necessary for it to be a specific format
     * @param {String} str - Due Date
     */
    setDueDate(str) {
        this.resetTimeout();
        this.dueDate = str;
        let changed = false;
        this.embed.fields.forEach(field => {
            if (field.name === 'Due Date') {
                field.value = this.dueDate;
                changed = true;
            }
        });
        if (!changed) {
            this.embed.addField('Due Date', this.dueDate);
        }
    }
    /**
     * Sends the embed in the channel the message was sent from
     * @param {Message} message 
     */
    showEmbed(message) {
        this.resetTimeout();
        message.channel.send(this.embed)
            .catch(console.error);
    }

    /**
     * Sets the type of the collab
     * @param {String} type - Can be 'audio', 'video' or 'image'
     */

    setType(type) {
        this.resetTimeout();
        if (typeof type !== 'string') throw new Error('type must be a string');
        if (!type.match(/(audio)|(video)|(image)/gi)) throw new Error('type must be image, video or audio');

        this.type = type;
    }

    /**
     * Publishes the collab embed, reacts to the message with the 'add' emoji, and pings @ping
     * @param {Message} message 
     * @returns {Promise} a promise
     */

    publish(message) {
        this.resetTimeout();
        /** @type {Model} */
        let model = message.client.mongoose.models.CollabModel
        let settings = message.client.settings;
        let cat = message.guild.channels.cache.find(c => c.id === settings.category.collab && c.type === 'category');
        let channelExists = message.guild.channels.cache.find(c => c.name === this.name && c.type === 'text');
        this.options.parent = cat;
        let drive = message.client.drive;

        this.embed.addField('To submit your track:', `1) Go to #bot-spam\n2) Post the command **${message.client.prefix}upload track ${this.name}**\n3) You'll be DM'd a link to a form where you can submit your file!`);
        this.embed.setFooter(`Reacting with ${message.client.settings.emojiAdd} will give you the @${this.name} role, used to notify you of updates on this specific collab.`)
        return new Promise((resolve, reject) => {
            if (!channelExists) resolve(message.guild.channels.create(this.name, this.options));
            else model.findOne({ channelID: channelExists.id }).exec()
                .then(res => {
                    if (res === null) resolve(channelExists);
                    else reject(new Error('CHANNEL_ALREADY_COLLAB'))
                })
                .catch(err => reject(err));
        })
            .then(channel => channel.send(`<@&${settings.role.ping}> **New Collab!**`, {
                embed: this.embed
            }))
            .then(sent => this.addRoleAndTrack(message, sent.channel, sent))
            .then(sent => sent.react(message.client.settings.emojiAdd))
            .then(() => drive.createCollabFolder(this.name));
    }
    /**
     * Creates the collab role and creates a new entry in the collabs collection
     * @param {Message} message - Message of the received command
     * @param {TextChannel} channel - The collab channel
     * @param {Message} sent - The collab description message
     * @returns {Message} sent
     */
    addRoleAndTrack(message, channel, sent) {
        /** @type {Model} */
        let model = message.client.mongoose.models.CollabModel
        let roleData = {
            data: {
                name: channel.name,
                color: 0xff0000,
                hoist: false,
                //position: idk,
                //permissions: idk,
                mentionable: true
            },
            reason: `Created for collab ${channel.name}`
        };

        return new Promise((resolve, reject) => {
            message.guild.roles.create(roleData)
                .then(role => {
                    let collabInfo = {
                        roleID: role.id,
                        channelID: channel.id,
                        messageID: sent.id,
                        channelName: channel.name,
                        collabType: this.type
                    };
                    return model.create(collabInfo);
                })
                .then(() => resolve(sent))
                .catch(err => reject(err));
        });
    }
}

module.exports = Collab;