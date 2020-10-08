const { MessageEmbed, User, TextChannel } = require('discord.js');

let defaults = {
    color: '#ff4444',
    description: '*no description!*',

    timeout: 1200000,  //20 minutes
    expTimeout: 300000, //5 minutes
    warnTimeout: 900000
};

/**
* @typedef {Object} BuilderOptions
* @property {User} author - The user linked to this instance
* @property {String} name - Name of "thing" linked to this instance
* @property {TextChannel} creationChannel - The channel this instance was created from
* @property {String} type - Either 'collab' or 'poll'
*/


/**
 * Creates an embed and a timeout for classes that needs both user output and an expiration time
 * @class
 */
class builder {
    /**
     * @param {BuilderOptions} obj
     */
    constructor(obj) {
        if (!obj.hasOwnProperty('author')) {
            console.error('builder class requires author');
            return false;
        }
        if (!obj.hasOwnProperty('name')) {
            console.error('builder class requires name');
            return false;
        }
        if (!obj.hasOwnProperty('creationChannel')) {
            console.error('builder class requires creationChannel');
            return false;
        }

        this.embed = new MessageEmbed();
        this.description = obj.description || defaults.description;
        this.color = obj.color || defaults.color;
        this.author = obj.author;
        this.name = obj.name;
        this.creationChannel = obj.creationChannel;
        this.expired = false;
        this.expTimer = undefined;
        this.warnTimer = setTimeout(() => {
            let message = `${this.author} your ${obj.type} creation is going to be cancelled in 5 minutes`;
            this.creationChannel.send(message)
                .then(() => {
                    this.expTimer = setTimeout(() => {
                        this.expired = true;
                        let message = `${this.author} your ${obj.type} creation is cancelled`;
                        this.creationChannel.send(message)
                            .catch(console.error);
                    }, defaults.expTimeout);
                })
                .catch(console.error);
        }, defaults.warnTimeout);
        this.updateEmbed();
    }
    /**
     * Sets the description of the embed
     * @param {String} str - Description
     */
    setDescription(str) {
        this.description = str;
        this.updateEmbed();
    }

    /**
     * Sets the title of the embed
     * @param {String} str - Title
     */
    setTitle(str) {
        this.name = str;
        this.updateEmbed();
    }
    /**
     * Resets the expiration timer
     */
    resetTimeout() {
        this.warnTimer.refresh();
        clearTimeout(this.expTimer);
    }

    /**
     * Cancels the expiration timer
     */
    cancelTimeout() {
        clearTimeout(this.warnTimer);
        clearTimeout(this.expTimer);
    }
    /**
     * Updates the embed (IDK...)
     */
    updateEmbed() {
        this.resetTimeout();
        this.embed.setTitle(this.name);
        this.embed.setDescription(this.description);
        this.embed.setColor(this.color);
    }

    /**
     * Resets the embed (IDK... i don't think we ever used it)
     */
    reset() {
        this.embed = new MessageEmbed();
        this.author = undefined;
        this.name = undefined;
        this.description = defaults.description;
        this.color = defaults.color;
        // this.cancelTimeout
    }
}

module.exports = builder;