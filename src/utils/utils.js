const {
	MessageEmbed,
	Permissions: { FLAGS },
} = require('discord.js');

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
};
