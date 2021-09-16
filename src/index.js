const {
	Client,
	Collection,
	Permissions: { FLAGS },
} = require('discord.js');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');
const { Guild, Interaction } = require('./utils/Structures.js');
const { Events } = require('./utils/enums');
const utils = require('./utils/utils');

class DiamondHandler extends EventEmitter {
	constructor(client, options) {
		super();
		if (!client || !client instanceof Client) throw new TypeError('Client is not instance od discord.js Client');
		options = Object.assign(
			{
				filesEndings: {
					commands: '.cmd.js',
					features: '.feature.js',
				},
			},
			options
		);
		if (
			!options.commandsDir ||
			!options.commandsDir.length ||
			!options.featuresDir ||
			!options.featuresDir.length ||
			!options.messagesPath ||
			!options.messagesPath.length
		)
			throw new TypeError('CommandsDir, FeaturesDir and MessagesPath in options are required');
		this.client = client;
		this.commands = new Collection();
		this.options = options;
		this.color = '#ffffff';
		this.defaultLanguage = 'english';
		this.db = {};
		this.db.global = {};
		this._build();
	}
	async _build() {
		let { commandsDir, featuresDir, messagesPath } = this.options;
		if (!path.isAbsolute(commandsDir)) commandsDir = path.resolve(path.dirname(module.parent.filename), commandsDir);
		if (!path.isAbsolute(featuresDir)) featuresDir = path.resolve(path.dirname(module.parent.filename), featuresDir);
		if (!path.isAbsolute(messagesPath)) messagesPath = path.resolve(path.dirname(module.parent.filename), messagesPath);
		if (!fs.existsSync(commandsDir)) throw new Error("Cannot find commandsDir. If you want to specify relative path, don't insert  '/' at start");
		if (!fs.existsSync(featuresDir)) throw new Error("Cannot find featuresDir. If you want to specify relative path, don't insert  '/' at start");
		if (!fs.existsSync(messagesPath)) throw new Error("Cannot find messagesPath. If you want to specify relative path, don't insert  '/' at start");
		this.options.commandsDir = commandsDir;
		this.options.featuresDir = featuresDir;
		const messages = utils.objectMerge(
			{
				internal: {
					commandsLoaded: 'Loaded {size} commands',
					featuresLoaded: 'Loaded {size} features',
				},
				external: {
					english: {
						slashCommandsLoadAddingError: 'Cannot add slash commands to this server, bot must be added with the `application.commands` scope',
						errorEmbedTitle: 'Error',
						permissions: {
							CREATE_INSTANT_INVITE: 'CREATE INSTANT INVITE',
							KICK_MEMBERS: 'KICK MEMBERS',
							BAN_MEMBERS: 'BAN MEMBERS',
							ADMINISTRATOR: 'ADMINISTRATOR',
							MANAGE_CHANNELS: 'MANAGE CHANNELS',
							MANAGE_GUILDS: 'MANAGE GUILDS',
							ADD_REACTIONS: 'ADD REACTIONS',
							VIEW_AUDIT_LOGS: 'VIEW AUDIT LOGS',
							PRIORITY_SPEAKER: 'PRIORITY SPEAKER',
							STREAM: 'STREAM',
							VIEW_CHANNEL: 'VIEW CHANNEL',
							SEND_MESSAGES: 'SEND MESSAGES',
							SEND_TTS_MESSAGES: 'SEND TTS MESSAGES',
							MANAGE_MESSAGES: 'MANAGE MESSAGES',
							EMBED_LINKS: 'EMBED LINKS',
							ATTACH_FILES: 'ATTACH FILES',
							READ_MESSAGE_HISTORY: 'READ MESSAGE HISTORY',
							MENTION_EVERYONE: 'MENTION EVERYONE',
							USE_EXTERNAL_EMOJIS: 'USE EXTERNAL EMOJIS',
							VIEW_GUILD_INSHIGHTS: 'VIEW GUILD INSHIGHTS',
							CONNECT: 'CONNECT',
							SPEAK: 'SPEAK',
							MUTE_MEMBERS: 'MUTE MEMBERS',
							DEAFEN_MEMBERS: 'DEAFEN MEMBERS',
							MOVE_MEMBERS: 'MOVE MEMBERS',
							USE_VAD: 'USE VAD',
							CHANGE_NICKNAMES: 'CHANGE NICKNAMES',
							MANAGE_NICKNAMES: 'MANAGE NICKNAMES',
							MANAGE_ROLES: 'MANAGE ROLES',
							MANAGE_WEBHOOKS: 'MANAGE WEBHOOKS',
							MANAGE_EMOJIS_AND_STICKERS: 'MANAGE EMOJIS AND STICKERS',
							USE_APPLICATION_COMMANDS: 'USE APPLICATION COMMANDS',
							REQUEST_TO_SPEAK: 'REQUEST TO SPEAK',
							MMANAGE_THREADS: 'MANAGE THREADS',
							USE_PUBLIC_THREADS: 'USE PUBLIC THREADS',
							USE_EXTERNAL_STICKERS: 'USE EXTERNAL STICKERS',
						},
						errors: {
							noPermissions: "You don't have required permissions to perform this action. Required permissions: {permissions}",
							noBotPermissions: 'Bot does not have required permissions to perform this action. Required permissions: {permissions}',
							commandDisabled: 'Sorry. This command was disabled by developers',
						},
						internalError: {
							title: 'Bot error',
							description: 'An error occurred while executing this command',
						},
					},
				},
			},
			await fs.readJSON(messagesPath)
		);
		if (!utils.objectEquals(messages, await fs.readJSONSync(messagesPath))) await fs.writeJSON(messagesPath, messages, { spaces: '\t', EOL: '\n' });
		this.messages = messages;
		this.messages.supportedLanguages = Object.keys(messages.external);
		this._buildCommands();
		this._buildFeatures();
		this.client.on('interactionCreate', interaction => this._onInteraction(interaction));
		this.client.on('ready', () => this._onReady());
	}
	_buildCommands() {
		this.categories = fs
			.readdirSync(this.options.commandsDir)
			.filter(category => fs.lstatSync(path.join(this.options.commandsDir, category)).isDirectory())
			.map(category => {
				const toReturn = Object.assign({ name: category }, require(path.join(this.options.commandsDir, category, '!category.json')), {
					files: fs
						.readdirSync(path.join(this.options.commandsDir, category))
						.filter(file => file != '!category.json' && file.endsWith(this.options.filesEndings.commands))
						.map(file => path.join(this.options.commandsDir, category, file)),
				});
				if (!toReturn.description || !toReturn.description.length)
					throw new Error(`${path.join(this.options.commandsDir, category)}: Missing description`);
				if (!toReturn.emoji || !toReturn.emoji.length) throw new Error(`${path.join(this.options.commandsDir, category)}}: Missing emoji`);
				return toReturn;
			});
		this.categories.forEach(category => {
			this.categories.find(cat => cat.name === category.name).commands = {};
			category.files.forEach(file => {
				const command = require(file);
				if (!command.name || !command.name.length) throw new Error(`${file}: Missing name`);
				if (!command.description || !command.description.length) throw new Error(`${file}: Missing description`);
				if (!command.run || typeof command.run != 'function') throw new Error(`${file}: Missing run function`);
				command.name = command.name.toLowerCase();
				this.commands.set(command.name, command);
			});
			delete category.files;
		});
		console.log(this.getMessage('commandsLoaded', { size: this.commands.size }));
		this.client.on(Events.COMMAND, interaction => this._onCommand(interaction));
	}
	_buildFeatures() {
		const files = fs.readdirSync(this.options.featuresDir).filter(file => file.endsWith(this.options.filesEndings.features));
		files.forEach(file => {
			file = require(path.join(this.options.featuresDir, file));
			if (!file || typeof file !== 'function') throw new Error('Feature must be a function');
			file(this.client, this);
		});
		console.log(this.getMessage('featuresLoaded', { size: files.length }));
	}
	async _onCommand(interaction) {
		const command = this.commands.get(interaction.commandName);
		if (command.disabled)
			return interaction.reply({
				embeds: [interaction.errorEmbed(interaction.guild.getMessage('errors.commandDisabled'))],
			});
		if (!(await interaction.hasPerms(command.permissions)))
			return interaction.reply({
				embeds: [
					interaction.errorEmbed(
						interaction.guild.getMessage('errors.noPermissions', {
							permissions: interaction.flagsToText(command.permissions).map(permission => `**${permission}**`),
						})
					),
				],
				ephemeral: true,
			});
		if (
			command.botPermissions &&
			command.botPermissions.length &&
			!interaction.channel.permissionsFor(interaction.guild.me).has(command.botPermissions)
		)
			return interaction.reply({
				embeds: [
					interaction.errorEmbed(
						interaction.guild.getMessage('errors.noBotPermissions', {
							permissions: interaction.flagsToText(command.botPermissions).map(permission => `**${permission}**`),
						})
					),
				],
			});
		const args = {};
		parseArgs = options => {
			if (!options) return;
			const values = options.map(option => interaction.options[`get${utils.firstUpper(option.type, '_', '')}`](option.name));
			options.forEach((option, index) => {
				const value = values[index];
				option.type = option.type.toLowerCase();
				if (!['subcommand', 'subcommand_group'].includes(option.type)) {
					args[option.name] = value;
				}
				if (!args.subcommand) args.subcommand = [];
				if (value != option.name) return;
				args.subcommand.push(value);
				parseArgs(option.options);
			});
		};
		parseArgs(cmd.options);
		if (args.subcommand) {
			args.subcommand = args.subcommand.join(' ');
			if (cmd.options.some(option => ['subcommand', 'subcommand_group'].includes(option.type.toLowerCase()))) {
				const permissions = cmd.options
					.find(option => option.name === args.subcommand.split(' ')[0])
					?.options?.find(option => option.name === args.subcommand.split(' ')[1])?.permissions;
				if (permissions) {
					if (!(await interaction.hasPerms(permissions)))
						return interaction.reply({
							embeds: [
								utils.errorEmbed(
									interaction.guild.getMessage('errors.noPermissions', {
										permissions: interaction.flagsToText(command.permissions).map(permission => `**${permission}**`),
									})
								),
							],
							ephemeral: true,
						});
				}
			}
		}
		try {
			cmd.run(command, args);
		} catch (error) {
			command.reply({
				embed: new MessageEmbed()
					.setColor('RED')
					.setTitle(interaction.guild.getMessage('internalError.title'))
					.setDescription(interaction.guild.getMessage('internalError.description')),
			});
			console.log(error);
		}
	}
	_onReady() {
		let commands = [...this.commands.values()];
		this.client.guilds.cache.forEach(async guild => {
			guild.commands.set(commands).catch(err => guild.systemChannel.send(guild.getMessage('slashCommandsLoadAddingError')));
			Object.assign(guild, Guild.call(guild, this));
		});
	}
	_onInteraction(interaction) {
		Object.assign(interaction, Interaction.call(interaction, this));
		if (interaction.isButton()) return this.client.emit(Events.BUTTON, interaction);
		if (interaction.isCommand()) return this.client.emit(Events.COMMAND, interaction);
		if (interaction.isContextMenu()) return this.client.emit(Events.CONTEXT_MENU, interaction);
		if (interaction.isSelectMenu()) return this.client.emit(Events.SELECT_MENU, interaction);
	}
	setDefaultLanguage(language) {
		if (!this.messages.supportedLanguages.includes(language.toLowerCase()))
			throw new Error('This language is not supported. Define it first in Messages file');
		this.defaultLanguage = language.toLowerCase();
	}
	setColor(color) {
		return (this.color = color);
	}
	setGuildOptions(guildId, options = {}) {
		if (!this.db[guildId]) this.db[guildId] = {};
		Object.assign(this.db[guildId], options);
	}
	/**
	 * A permission group
	 * @typedef {Object} permissionGroup
	 * @property {String} name The name of group
	 * @property {Array} members List of members ids
	 * @property {String[]} permissions List of permissions
	 */
	/**
	 * @param  {permissionGroup[]} permissions
	 */
	setGlobalPermissions(permissions) {
		this.db.global.permissions = permissions;
	}
	getMessage(path, placeholders) {
		path = 'internal.' + path;
		let message = utils.objectPath(this.messages, path);
		if (placeholders) {
			Object.entries(placeholders).forEach(placeholder => (message = message.replaceAll(`{${placeholder[0]}}`, placeholder[1])));
		}
		return message;
	}
}

module.exports = DiamondHandler;
