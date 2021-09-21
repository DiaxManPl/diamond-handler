const {
	MessageEmbed,
	Permissions: { FLAGS },
	MessageButton,
	MessageActionRow,
} = require('discord.js');
const { Events } = require('./constants');
const EventEmitter = require('events');

const objectEquals = (x, y) => {
	if (x === null || !x || y === null || !y) {
		return x === y;
	}
	// after this just checking type of one would be enough
	if (x.constructor !== y.constructor) {
		return false;
	}
	// if they are functions, they should exactly refer to same one (because of closures)
	if (x instanceof Function) {
		return x === y;
	}
	// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
	if (x instanceof RegExp) {
		return x === y;
	}
	if (x === y || x.valueOf() === y.valueOf()) {
		return true;
	}
	if (Array.isArray(x) && x.length !== y.length) {
		return false;
	}

	// if they are dates, they must had equal valueOf
	if (x instanceof Date) {
		return false;
	}

	// if they are strictly equal, they both need to be object at least
	if (!(x instanceof Object)) {
		return false;
	}
	if (!(y instanceof Object)) {
		return false;
	}

	// recursive object equality check
	var p = Object.keys(x);
	return (
		Object.keys(y).every(function (i) {
			return p.indexOf(i) !== -1;
		}) &&
		p.every(function (i) {
			return objectEquals(x[i], y[i]);
		})
	);
};

const objectPath = (obj, path) => {
	try {
		return path.split('.').reduce((o, i) => o[i], obj);
	} catch (e) {}
};

const objectMerge = (target, ...sources) => {
	sources.forEach(source => {
		Object.entries(source).forEach(([key, value]) => {
			if (value && typeof value === 'object') {
				objectMerge((target[key] = target[key] || {}), value);
				return;
			}
			target[key] = value;
		});
	});

	return target;
};
class PageBuilder extends EventEmitter {
	constructor(cmd, pages, options = {}) {
		super();
		this.options = Object.assign(
			{
				afkTimeout: 2 * 60 * 1000,
				endMessage: false,
			},
			options
		);
		if (typeof pages === 'object' && !Array.isArray(pages)) {
			const { cb, items } = pages;
			this.pages = items.map((item, index, { length }) => cb(item, index + 1, length));
		} else {
			if (!Array.isArray(pages)) pages = [pages];
			this.pages = pages.map((page, index) => (typeof page === 'function' ? page(index + 1, pages.length) : page));
		}

		this.cmd = cmd;
		this.client = cmd.client;
		this.current = 0;
	}
	async build() {
		this.msg = await this.cmd.reply(this._toSend(false, this.current, [0, 1]));

		this.client.on(Events.BUTTON, btn => this._onCollect(btn));
		this.once('end', this._onEnd);
		this.timeout = setTimeout(() => this.emit('end'), this.options.afkTimeout);
		return this;
	}
	_toSend(end = false, current = 0, disabledButtons = []) {
		if (end) {
			if (!this.options.endMessage) this.options.endMessage = this.pages[this.current];
			return this.options.endMessage instanceof Embed
				? {
						embeds: [this.options.endMessage],
						components: [],
						fetchReply: true,
				  }
				: {
						content: this.options.endMessage,
						components: [],
						fetchReply: true,
				  };
		} else {
			const buttons = [
				new MessageButton({
					style: 'PRIMARY',
					label: '🡄',
					customId: 'first',
				}),
				new MessageButton({
					style: 'PRIMARY',
					label: '❰',
					customId: 'previous',
				}),
				new MessageButton({
					style: 'DANGER',
					label: '✖',
					customId: 'stop',
				}),
				new MessageButton({
					style: 'PRIMARY',
					label: '❱',
					customId: 'next',
				}),
				new MessageButton({
					style: 'PRIMARY',
					label: '🡆',
					customId: 'last',
				}),
			];
			disabledButtons.forEach(btn => {
				buttons[btn].setDisabled(true);
			});
			return this.pages[current] instanceof Embed
				? {
						embeds: [this.pages[current]],
						components: [new MessageActionRow().addComponents(buttons)],
						fetchReply: true,
				  }
				: {
						content: this.pages[current],
						components: [new MessageActionRow().addComponents(buttons)],
						fetchReply: true,
				  };
		}
	}
	_onCollect(btn) {
		if (btn.message.id != this.msg.id) return;
		if (!['first', 'previous', 'stop', 'next', 'last'].includes(btn.customId)) return;
		if (btn.user.id != this.cmd.user.id)
			return btn.reply({
				embeds: [interaction.errorEmbed(this.cmd.guild.getMessage('errors.paginatorNoPermissions'))],
				ephemeral: true,
			});
		clearTimeout(this.timeout);
		switch (btn.customId) {
			case 'first':
				this.current = 0;
				break;
			case 'previous':
				this.current--;
				break;
			case 'stop':
				this.emit('end');
				return;
			case 'next':
				this.current++;
				break;
			case 'last':
				this.current = this.pages.length - 1;
				break;
		}
		const disabled = this.current === 0 ? [0, 1] : this.current === this.pages.length - 1 ? [3, 4] : [];
		btn.update(this._toSend(false));
		this.timeout = setTimeout(() => this.emit('end'), this.options.afkTimeout);
	}
	_onEnd() {
		clearTimeout(this.timeout);
		this.cmd.editReply(this._toSend(true));
		this.client.removeListener(Events.BUTTON, this._onCollect);
	}
}
class ErrorEmbed extends MessageEmbed {
	constructor(guild, message, data) {
		data = Object.assign(
			{
				title: guild.getMessage('errorEmbedTitle'),
				color: 'RED',
				description: message,
			},
			data
		);
		super(data);
	}
}

class Embed extends MessageEmbed {
	constructor(instance, data) {
		data = Object.assign(
			{
				color: instance.color,
			},
			data
		);
		super(data);
	}
}

const flagsToText = (guild, flags) => {
	if (!Array.isArray(flags)) flags = [flags];
	return flags.map(flag => guild.getMessage('permissions.' + Object.entries(FLAGS).find(e => e.includes(flag))?.[0]) || flag);
};

module.exports = {
	objectEquals,
	objectPath,
	objectMerge,
	ErrorEmbed,
	Embed,
	flagsToText,
	PageBuilder,
};
