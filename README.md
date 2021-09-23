# DiamondHandler

DiamondHandler is a [discord.js](https://discord.js.org) handler

# Table of contents

<!-- toc -->

- [Features](#features)
- [Instalation](#instalation)
- [Ussage](#ussage)
  * [File structure](#file-structure)
  * [Code](#code)
    + [Expamle command](#expamle-command)
    + [Expamle feature](#expamle-feature)
- [Documentation](#documentation)
  * [Command object](#command-object)
    + [`name`](#name)
    + [`description`](#description)
    + [`disabled`](#disabled)
    + [`options`](#options)
      - [`name`](#name-1)
      - [`description`](#description-1)
      - [`type`](#type)
    + [`run(interaction, args, instance)`](#runinteraction-args-instance)
      - [`interaction`](#interaction)
      - [`args`](#args)
      - [`instance`](#instance)
  * [Expample subcommand](#expample-subcommand)
  * [Handler options](#handler-options)
    + [`commandsDir`](#commandsdir)
    + [`featuresDir`](#featuresdir)
    + [`messagesPath`](#messagespath)
    + [`fileEndings`](#fileendings)
      - [`commands`](#commands)
      - [`features`](#features)
    + [`defaultLanguage`](#defaultlanguage)
  * [Handler functions](#handler-functions)
    + [`setColor(color)`](#setcolorcolor)
      - [`color`](#color)
    + [`setGuildLanguage(guildId, language)`](#setguildlanguageguildid-language)
      - [`guildId`](#guildid)
      - [`language`](#language)
    + [`setGuildPermissions(guildId, permissions)`](#setguildpermissionsguildid-permissions)
      - [`guildId`](#guildid-1)
      - [`permissions`](#permissions)
    + [`setGlobalPermissions(permissions)`](#setglobalpermissionspermissions)
    + [`getMessage(path, placeholders)`](#getmessagepath-placeholders)
        * [`path`](#path)
        * [`placeholders`](#placeholders)
  * [Injected functions](#injected-functions)
    + [Guild](#guild)
      - [`getLanguage()`](#getlanguage)
      - [`getMessage(path, placeholders)`](#getmessagepath-placeholders-1)
        * [`path`](#path-1)
        * [`placeholders`](#placeholders-1)
    + [CommandInteraction](#commandinteraction)
      - [`hasPerms(nodes)`](#haspermsnodes)
        * [`nodes`](#nodes)
      - [`getMessage(path, placeholders)`](#getmessagepath-placeholders-2)
      - [`embed (data)`](#embed-data)
        * [`data`](#data)
    + [`errorEmbed (message, data)`](#errorembed-message-data)
      - [`message`](#message)
      - [`data`](#data-1)
    + [`flagsToText (flags)`](#flagstotext-flags)
      - [`flags`](#flags)
    + [`createPages (pages, options)`](#createpages-pages-options)
      - [`pages`](#pages)
      - [`options`](#options-1)
        * [`afkTimeout`](#afktimeout)
        * [`endMessage`](#endmessage)
  * [Permissions](#permissions)
    + [Permission string](#permission-string)
      - [Wildcards](#wildcards)
      - [Negations](#negations)
    + [Members](#members)

<!-- tocstop -->

# Features

- You don't have to worry about writing command handler and feature handler
- DiamondHandler has build-in language manager
- Slash Commands arugemnts parser

# Instalation

```bash
npm i diamond-handler
```

# Ussage

## File structure

```
📂src
 ┣ 📂cmds - commands dir
 ┃ ┗ 📂utils - category dir
 ┃ ┃ ┣ 📜!category.json - category info
 ┃ ┃ ┗ 📜test.cmd.js - command
 ┣ 📂features - features dir
 ┃ ┗ 📜test.feature.js - feature
 ┣ 📜index.js - main file
 ┗ 📜Messages.json - JSON file for messages
```

---

## Code

```js
const DiamondHandler = require('diamond-handler');
const { Client } = require('discord.js');

const client = new Client({
	commandsDir: 'cmds', //Where command files are stored
	featuresDir: 'features', //Where features files are stored
	messagesPath: 'messages.json', //Where messages are stored
});
const handler = new DiamondHandler(client);

client.login('superSecretToken');
```

### Expamle command

```js
module.exports = {
	name: 'test', //The name of the command
	description: 'Test command', //The description of the command (you can also specify the description for different languages in Messages.json)
	run: (interaction, args) => {
		//Function parameters: 1 - interaction 2 - arguments 3- instance (DiamondHandler)
		interaction.reply('Hello world!');
	},
};
```

---

### Expamle feature

```js
module.exports = (client, instance) => {
	//Function parameters 1 - client 2 - instance (DiamondHandler)
	console.log('Hello world!');
};
```

# Documentation

## Command object

### `name`

The name of the command

---

### `description`

The description of the command

---

### `disabled`

Sould the command be disabled or not

---

### `options`

Command arguments

#### `name`

The name of the option

---

#### `description`

The description of the option

---

#### `type`

The type of the option (see [option types](https://discord.js.org/#/docs/main/stable/typedef/ApplicationCommandOptionType))

---

### `run(interaction, args, instance)`

Function that will be run when command is executed

#### `interaction`

[discord.js interaction](https://discord.js.org/#/docs/main/stable/class/CommandInteraction)

---

#### `args`

Arguments provided by user

---

#### `instance`

DiamondHandler instance

---

## Expample subcommand

```js
module.exports = {
	name: 'name',
	description: 'description',
	options: [
		{
			name: 'test',
			description: 'test subcommand',
			type: 'sub_command',
		},
		{
			name: 'test2',
			description: 'test subcommand 2',
			type: 'sub_command',
		},
	],
	run: (interaction, args, instance) => {
		console.log(args.subcommand); //'test' or 'test2'
		//args.subcommand returns which subcommand was run
	},
};
```

## Handler options

These are all options you can pass to the handler as second argument

### `commandsDir`

Directory where commands are stored

---

### `featuresDir`

Directory where features are stored

---

### `messagesPath`

File where messages are stored

### `fileEndings`

If file in commandsDir or featuresDir not ends with this this file will be ignored

#### `commands`

File endings in commandsDir. Default: `.cmd.js`

#### `features`

File endings in featuresDir. Default: `.feature.js`

### `defaultLanguage`

Default language used in [message system](#message-system). Default: `english`

---

## Handler functions

### `setColor(color)`

Sets the default color in [embed](#embed)

#### `color`

The color to set

---

### `setGuildLanguage(guildId, language)`

Sets guild language (used in [message system](#message-system))

#### `guildId`

ID of the guild to be set on

---

#### `language`

Language to set

---

### `setGuildPermissions(guildId, permissions)`

Sets guild permissions (used in [permission system](#permissions))

#### `guildId`

ID of the guild to set on

---

#### `permissions`

Permissions to set

---

### `setGlobalPermissions(permissions)`

Similar to `setGuildPermissions` but sets global permissions (permissions which work for every guild)

---

### `getMessage(path, placeholders)`

Returns the message from Messages.json

##### `path`

The path in messages object e.g. `test.testMessage`

```json
{{
	"internal": {
		"commandsLoaded": "Loaded {size} commands",
		"featuresLoaded": "Loaded {size} features",
		"test": {
			"testMessage": "Hello {testPlaceholder}"
		}
	},
	"external": {
		"english": {}
	}
}}
```

---

##### `placeholders`

Object with placeholders

```
{
	testPlaceholder: 'Test'
}
```

If message contains placeholder (in this example `{testPlaceholder}`) it will be replaced with the value of placeholder (in this example `Test`)

---

## Injected functions

### Guild

#### `getLanguage()`

Returns the guild language

---

#### `getMessage(path, placeholders)`

Returns the message from Messages.json based on guild language

##### `path`

The path in messages object e.g. `test.testMessage`

```json
{{
	"internal": {
		"commandsLoaded": "Loaded {size} commands",
		"featuresLoaded": "Loaded {size} features"
	},
	"external": {
		"english": {
			"test": {
				"testMessage": "Hello world!"
			}
		}
	}
}}
```

##### `placeholders`

Object with placeholders

```
{
	testPlaceholder: 'Test'
}
```

If message contains placeholder (in this example `{testPlaceholder}`) it will be replaced with the value of placeholder (in this example `Test`)

### CommandInteraction

#### `hasPerms(nodes)`

Check if the member of interaction has following permissions.

##### `nodes`

Array of permissions (read more about our permission system [here](#permissions))

---

#### `getMessage(path, placeholders)`

Similar to the [`guild#getMessage`](#getmessagepath-placeholders-1) function but inserts command name to the path

---

#### `embed (data)`

Creates [MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed) with [default color](#setcolorcolor)

##### `data`

[MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed) or [MessageEmbedData](https://discord.js.org/#/docs/main/stable/typedef/MessageEmbedOptions)

---

### `errorEmbed (message, data)`

Creates errorEmbed with given message

#### `message`

The message to set into embed

---

#### `data`

[MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed) or [MessageEmbedData](https://discord.js.org/#/docs/main/stable/typedef/MessageEmbedOptions)

---

### `flagsToText (flags)`

Returns translated [FLAGS](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS) based on guild language

#### `flags`

The flags to translate

---

### `createPages (pages, options)`

Creates paginator

#### `pages`

The array of pages to create paginator from

---

#### `options`

##### `afkTimeout`

Time of inactivity to auto close paginator. Default: `2 minutes`

---

##### `endMessage`

Message to display after paginator is closed. `False` will leave current page. Default: `false`

---

## Permissions

Our permission system is simple. You provide an array of groups, and each group contains a list of members and permissions.

Example group:

```js
{
	name: 'the name of group',
	members: ['Discord user ID or Discord role ID'],
	permissions: ['permission']
}
```

### Permission string

Basic usage is simple. For example permission `commands.utils.ban` gives group access to use function, where was provided permission `commands.utils.ban`

#### Wildcards

What are they? Wildcard are char (in this handler `*`) that gives all permissions from parent node. For exapmle permission `commands.utils.*` gives permissions for all functions whoose parent node is `commands.utils`

#### Negations

Negations are char (in this handler `-`) that removes permission from group. For example group has permissions `commands.utils.*` and `-commands.utils.kick`. This group can run all functions whoose parent node is `commands.utils` but cannot run `command.utils.kick`

### Members

Group members are simply an array of Discord User IDs or Discord Role IDs
