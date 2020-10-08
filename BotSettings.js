const { Model } = require('mongoose')

class BotSettings {
	/**
	 * Creates a settings object, capable of storing and making available to the code both hardcoded and dbStored data
	 * @param {Number} mode 
	 * @param {Model} DbSettingModel 
	 */
	constructor(mode, DbSettingModel) {

		this.mode = mode;

		// Common setting groups
		this.channel = {};
		this.inputChannels = [];
		this.category = {};
		this.role = {};

		// Hard coded settings. If changed by settings command, these will reset on restart
		this.emojiAdd = '☑️';
		this.collabFile = './misc/collabs.json';
		this.errorColor = 0xff0000;
		this.okColor = 0x24bf39;
		this.warnColor = 0xc8cf15;
		this.infoColor = 0x4287f5;

		// Db settings. These persist.
		this.channelDailyListeningProduction = new DbSetting(DbSettingModel, 'channelDailyListeningProduction', 'string');
		this.channelDailyListeningDev = new DbSetting(DbSettingModel, 'channelDailyListeningDev', 'string');

		this.channelBotLogProduction = new DbSetting(DbSettingModel, 'channelBotLogProduction', 'string');
		this.channelBotLogDev = new DbSetting(DbSettingModel, 'channelBotLogDev', 'string');

		this.channelCountingProduction = new DbSetting(DbSettingModel, 'channelCountingProduction', 'string');
		this.channelCountingDev = new DbSetting(DbSettingModel, 'channelCountingDev', 'string');

		this.mentionThreshold = new DbSetting(DbSettingModel, 'mentionThreshold', 'number');

		this.greetingMaxPay = new DbSetting(DbSettingModel, 'greetingMaxPay', 'number');
		this.greetingMinPay = new DbSetting(DbSettingModel, 'greetingMinPay', 'number');

		this.countChance = new DbSetting(DbSettingModel, 'countChance', 'number');

		// this.test = new DbSetting(db, 'test', 'object', (v) => {
		// 	if (typeof v === 'object') {
		// 		let props = Object.keys(v);
		// 		if (typeof v.foo == 'number' && props.length == 1) return true;
		// 	} 
		// 	return false;
		// });

		switch (mode) {

			case 1: { // PRODUCTION

				this.channel = {
					hangout: '411094096187359232',
					botEngineering: '457326843318501379',
					botSpam: '415228195160195084',
					botRadio: '454420761319571476',
					musicRoomTexting: '590889886018699264',
					radio: '759077979753283686',
					radioText: '759078138235584604'
				};
				this.inputChannels = [
					this.channel.botEngineering,
					this.channel.botSpam,
					this.channel.botRadio
				];
				this.category = {
					collab: '398301493750530068',
					archive: '725190372862459934',
				};
				this.role = {
					qm: '566228165756846101',
					ping: '517661943645995008'
				}
				break;

			}

			case 2: { // DEV

				this.channel = {
					hangout: '703380007849951326', // general
					botEngineering: '710306244942102528', // testing-shit
					botSpam: '739783468489113651', // bot-spam
					botRadio: '710306244942102528', // testing-shit
					musicRoomTexting: '710306244942102528', // testing-shit
					radio: '758020941480460429',
					radioText: '758024208696475841'
				};
				this.inputChannels = [
					this.channel.botEngineering,
					this.channel.botSpam,
				];
				this.category = {
					collab: '712407773589274624', // collabcat
					archive: '716080049702567936', // archive
				};
				this.role = {
					qm: '714454533715001344',
					ping: '712538117705302027'
				}
				break;
			}

			default: {

				throw new Error("settings must be called with a mode");

			}
		}
	}
}

class DbSetting {
	/**
	 * Creates a setting that's stored in the DataBase
	 * @param {mongoose.Model} model - The mongoose Model for this kind of documents
	 * @param {String} name - Name of the property
	 * @param {String} type - Type of the property
	 * @param {Function} [validate] - validation function
	 */
	constructor(model, name, type, validate = (v) => { return true }) {
		this.model = model
		this.name = name;
		this.type = type;
		this.validate = validate;
	}

	/**
	 * Gets or sets a database value from the settings collection
	 * @param {Object} value - If provided, setting will be updated in the database. Provided type must match the type indicated for the setting.
	 * @return {null|Object} Null when setting. Object when getting.
	 */
	async val() {
		return new Promise((resolve, reject) => {
			if (arguments.length === 0) {
				this.model.findOne({ name: this.name }, (err, res) => {
					if (err) reject(err)
					if (res !== null) resolve(res.value);
					else reject(`"${this.name}" not found in the DB. You need to set it first`);
				})
			} else if (arguments.length === 1) {
				let v = arguments[0];
				if (this.type === 'object') {
					try {
						v = JSON.parse(v);
					} catch (err) {
						return reject("Supplied value not valid JSON");
					}
				} else if (this.type === 'number') {
					v = parseFloat(v);
					if (typeof v !== 'number') return reject(`Supplied value for ${this.name} is not a number`);
				}

				if (!this.validate(v)) reject(`Invalid value supplied for ${this.name}`);

				this.model.updateOne({ name: this.name }, { $set: { name: this.name, value: v } }, { upsert: true }, (err, res) => {
					if (err) reject(err)
					if (r !== null) resolve(true);
					else reject("That isn't a setting name");

				})
			} else reject('DbSetting.val() takes 0 arguments for getting or a single value for setting');
		});
	}
}

module.exports = BotSettings;