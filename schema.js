const { Schema } = require('mongoose')

module.exports = {
    DbSettingSchema: new Schema({
        name: Schema.Types.String,
        value: Schema.Types.Mixed //https://mongoosejs.com/docs/schematypes.html#mixed
    }),

    CollabSchema: new Schema({
        roleID: Schema.Types.String,
        messageID: Schema.Types.String,
        channelID: Schema.Types.String,
        channelName: Schema.Types.String,
        collabType: Schema.Types.String,

        dueTime: Schema.Types.Number,
        submissionsOpen: Schema.Types.Boolean
    }),

    UploadRequest: new Schema({
        ts: Schema.Types.Number,
        token: Schema.Types.String,
        username: Schema.Types.String,
        userID: Schema.Types.String,
        channelID: Schema.Types.String
    }),

    TralbumSchema: new Schema({
        url: Schema.Types.String,
        type: Schema.Types.String,
        title: Schema.Types.String,
        tracklist: [
            {
                url: Schema.Types.String,
                title: Schema.Types.String
            }
        ]
    }),

    MemberSchema: new Schema({
        userID: Schema.Types.String,
        dateJoined: Schema.Types.Number,
        firstMentionedByID: Schema.Types.String,
        mentioned: Schema.Types.Number,
        mentions: [
            {
                date: Schema.Types.Number,
                byID: Schema.Types.String
            }
        ]
    }),

    CoverArtSchema: new Schema({
        channelID: Schema.Types.String,
        channelName: Schema.Types.String,
        covers: [
            {
                imageID: Schema.Types.String,
                link: Schema.Types.String
            }
        ]
    }),
    PirateThingSchema: new Schema({
        url: Schema.Types.String,
        submitter: Schema.Types.String,
        cleared: Schema.Types.Boolean
    }),
    CoverArtVoteSchema: new Schema({
        channelID: Schema.Types.String,
        document: Schema.Types.String,
        image: Schema.Types.String,
        count: Schema.Types.Number
    })
}