'use strict';
// https://discord.gg/ChDwq35
const Discord = require('discord.js');
const { Client } = require('unb-api');
const { isNumber } = require('lodash');
const { Model } = require('mongoose');
const unb = new Client('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiI3NDIxOTgyODAxNTg1NzcyNjciLCJpYXQiOjE1OTcwMjQyNTl9.j9pJRB4RozIjkDJMaZRz0eUInlISeiRMDgF5FCOiDJw');

module.exports = {
    name: 'message',
    async execute(message) {

        // Be careful with your checks here. Anything unchecked will fire every time a message is posted!

        if (message.mentions.users.size > 0) {
            handleMentions(message); // promisify this
            if (message.channel.id === message.client.settings.channel.hangout) {
                handleGreetings(message);
            }
        }

        if (
            message.channel.id == await message.client.settings.channelCountingProduction.val() ||
            message.channel.id == await message.client.settings.channelCountingDev.val()
        ) {
            maybeCount(message);
        }

    }

};

async function handleGreetings(message) {
    const client = message.client;
    /** @type {Model} */
    let modelMember = client.mongoose.models.MemberModel
    const botSpamChannel = message.guild.channels.cache.find(c => c.id === client.settings.channel.botSpam);


    let userIDquery = message.mentions.users.map(user => { return { userID: user.id } });
    let mentionedMemberData = await modelMember.find({ $or: userIDquery });
    let greets = [];

    mentionedMemberData.forEach(m => {
        if (m.firstMentionedByID == null) {
            greets.push({
                greetedID: m.userID,
                speed: Date.now() - m.dateJoined
            });
        }
    });

    if (greets.length > 0) {
        try {
            // update to show that this member greeted the member mentioned for the first time
            await modelMember.updateMany({ $or: greets.map(u => { return { userID: u.greetedID }; }) }, { $set: { firstMentionedByID: message.author.id } });
        } catch (err) {
            client.logger.log(err);
            return;
        }

        // determine quality of figging
        let earnings = 0;
        let maxPay = await client.settings.greetingMaxPay.val();
        let minPay = await client.settings.greetingMinPay.val();

        greets.map(g => {
            let n = Math.floor(maxPay / (g.speed / 1000));
            earnings += (n > minPay) ? n : minPay;
        });

        await unb.editUserBalance(message.guild.id, message.author.id, { cash: earnings }, "Greeted a new member");

        let embed = new Discord.MessageEmbed();

        embed.setDescription(`${message.author.username} made <:noisedoll:409079087861071872> ${Number(earnings).toLocaleString()} for greeting new users! <:fig:539860896563068928> <:fig:539860896563068928> <:fig:539860896563068928>`);
        embed.setColor(message.client.settings.okColor);
        botSpamChannel.send(embed).catch(e => console.error(e));

    }
}

async function handleMentions(message) {
    const client = message.client;
    /** @type {Model} */
    let modelMember = client.mongoose.models.MemberModel
    const botSpamChannel = message.guild.channels.cache.find(c => c.id === client.settings.channel.botSpam);
    let userIDquery = message.mentions.users.map(user => { return { userID: user.id } });

    await Promise.all(
        userIDquery.map(uq => {
            return modelMember.findOne(uq).exec()
                .then(member => {
                    if (member === null) {
                        return modelMember.create({
                            userID: uq.userID,
                            dateJoined: Date.now(),
                            firstMentionedByID: null,
                            mentions: [{ date: Date.now(), byID: message.author.id }]
                        });
                    } else {
                        let mentions = member.mentions || [];
                        mentions.push({ date: Date.now(), byID: message.author.id });
                        return modelMember.updateOne(uq, { $set: { mentions: mentions } }).exec();
                    }
                });
        })
    ).then(async (result) => {
        const dayAgo = Date.now() - 86400000; // 1000 * 60 * 60 * 24
        const mentionThreshold = await client.settings.mentionThreshold.val();

        modelMember.find({ $or: userIDquery }).exec()
            .then(members => {
                members.forEach(member => {
                    let mentionsInLastDay = member.mentions.filter(m => m.date > dayAgo).length;
                    if (mentionsInLastDay >= mentionThreshold) {
                        let embed = new Discord.MessageEmbed();
                        let mentionedName = message.guild.members.cache.find(m => m.id === member.userID).displayName || null;
                        if (mentionedName) {
                            embed.setDescription(`Hey <@${message.author.id}>! **${mentionedName}** has been mentioned ${mentionsInLastDay} times in the past 24 hours!`);
                            embed.setColor(message.client.settings.infoColor);
                            botSpamChannel.send(embed).catch(e => console.error(e));
                        }
                    }
                });
                //let mentions = members.reduce((a, b) => {return {mentions: a.mentions.concat(b.mentions)}});
            });
    });

}

async function maybeCount(message) {
    let n = parseInt(message.content.replace(/[^\d]/g, ''), 10);

    if (isNumber(n)) {
        let countChance = await message.client.settings.countChance.val();
        if (Math.random() * 100 <= countChance) {
            message.channel.send(n + 1);
        }
    }
}