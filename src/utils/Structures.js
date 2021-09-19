const utils = require('./utils');
const {
	Permissions: { FLAGS },
} = require('discord.js');

exports.Guild = function (instance) {
	return {
		getLanguage: () => instance.db[this.id]?.language || instance.options.defaultLanguage,
		getMessage: (path, placeholders) => {
			path = `external.${this.getLanguage()}.${path}`;
			let message = utils.objectPath(instance.messages, path);
			if (placeholders) {
				Object.entries(placeholders).forEach(placeholder => (message = message.replaceAll(`{${placeholder[0]}}`, placeholder[1])));
			}
			return message;
		},
	};
};

exports.Interaction = function (instance) {
	return {
		hasPerms: nodes => {
			if (!nodes) return true;
			if (!Array.isArray(nodes)) nodes = [nodes];
			const checkPerms = (userPerms, node) => {
				if (userPerms.includes('-' + node)) return false;
				if (userPerms.includes(node) || userPerms.includes('*')) return true;
				node = node.split('.');
				node = node.map((e, i) => node.slice(0, i + 1).join('.'));
				if (node.some(e => userPerms.includes('-' + e + '.*'))) return false;
				if (node.some(e => userPerms.includes(e + '.*'))) return true;
				return false;
			};
			const globalCheck = node => {
				let perms = instance.db.global.permissions;
				if (!perms) return false;
				perms = Object.values(perms);
				const group = perms.find(e => e.members.includes(this.user.id));
				if (!group) return false;
				const userPerms = group.permissions;
				return checkPerms(userPerms, node);
			};
			return nodes.some(node => {
				if (Object.entries(FLAGS).some(e => e.includes(node))) {
					return this.channel.permissionsFor(this.member).has(node);
				} else if (node.startsWith('global')) {
					return globalCheck(node);
				} else if (node.startsWith('commands')) {
					if (!this.guild) return false;
					let perms = instance.db[this.guild.id]?.permissions;
					if (!perms) return globalCheck(node);
					perms = Object.values(perms);
					let group =
						perms.find(e => e.members.includes(this.user.id)) ||
						perms.find(e => this.member.roles.cache.sort((a, b) => a.position - b.position).find(role => e.members.includes(role)));
					if (!group) return false;
					let userPerms = group.permissions;
					perms = checkPerms(userPerms, node);
					if (!perms) return globalCheck(node);
				}
			});
		},
		getMessage: (path, placeholders) => this.guild.getMessage(`commands.${this.commandName.toLowerCase()}.messages.${path}`, placeholders),
		errorEmbed: (message, data) => {
			return new utils.ErrorEmbed(this.guild, message, data);
		},
		embed: data => new utils.Embed(instance, data),
		flagsToText: flags => utils.flagsToText(this.guild, flags),
	};
};
