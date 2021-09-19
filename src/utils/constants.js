exports.Events = Object.freeze({ BUTTON: 'button', COMMAND: 'command', CONTEXT_MENU: 'contextMenu', SELECT_MENU: 'selectMenu' });
exports.ApplicationCommandOptionTypes = Object.freeze({
	Numeric: Object.freeze({
		SUB_COMMAND: 1,
		SUB_COMMAND_GROUP: 2,
		STRING: 3,
		INTEGER: 4,
		BOOLEAN: 5,
		USER: 6,
		CHANNEL: 7,
		ROLE: 8,
		MENTIONABLE: 9,
		NUMBER: 10,
		MEMBER: 6,
	}),
	Functions: {
		SUB_COMMAND: 'getSubcommand',
		SUB_COMMAND_GROUP: 'getSubcommandGroup',
		STRING: 'getString',
		INTEGER: 'getInteger',
		BOOLEAN: 'getBoolean',
		USER: 'getUser',
		CHANNEL: 'getChannel',
		ROLE: 'getRole',
		MENTIONABLE: 'getMentionable',
		NUMBER: 'getNumber',
		MEMBER: 'getMember',
	},
});
