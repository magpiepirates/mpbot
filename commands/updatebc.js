'use strict';
const bc = require('../modules/bcscraper.js')
const { Message } = require('discord.js')

module.exports = {
    name: 'ubc',
    adminOnly: true,
    description: 'Updates the tracklist stored in our DataBase. It should be used only when a new album is added to Bandcamp',

    /**
     * @param {Message} message 
     * @param {String[]} args 
     */
    execute(message, args) {
        bc.updateTrackList(message.client.mongoose.models.TralbumModel)
            .catch(console.error)
    }
}