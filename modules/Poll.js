
const reactionEmojis = "🍏 🍇 🍒 🥥 🍋 🍉 🍆 🍌 🍐 🍓 🍈 🍑 🥭 🍍 🥝 🍅".split(' ');
const builder = require('./_builder.js');

class Poll extends builder {
    constructor(obj) {
        obj.type = 'poll';
        super(obj);
        this.pollOpts = [];
    }

    addOption(opt) {
        this.pollOpts.push(opt);
        this.resetTimeout();
    }

    removeOption(index) {
        this.pollOpts.splice(index);
        this.resetTimeout();
    }

    publish(channel) {
        this.resetTimeout();
        this.description = '';
        let len = this.pollOpts.length;
        for (let i = 0; i < len; i++) {
            this.description += `${reactionEmojis[i]}) ${this.pollOpts[i]}\n`;
        }

        this.updateEmbed();

        channel.send(this.embed)
            .then(async sent => {
                try {
                    for (let i = 0; i < len; i++)
                        await sent.react(reactionEmojis[i]);
                } catch (err) {
                    console.error(err);
                }
            })
            .catch(err => console.error(err));
    }
}

module.exports = Poll;