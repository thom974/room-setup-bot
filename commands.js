const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { Constants } = require('discord.js')
const dotenv = require('dotenv')

dotenv.config()

const commands = [
    new SlashCommandBuilder()
        .setName('greeting')
        .setDescription('bot sends a greeting'),
    new SlashCommandBuilder()
        .setName('random')
        .setDescription('gives a random number in the specified range, inclusive')
        .addNumberOption(option => option
            .setName('lower')
            .setDescription('the lower bound of the range')
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName('upper')
            .setDescription('the upper bound of the range')
            .setRequired(true)
        )
]
    .map(command => command.toJSON())

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN)

rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), {
    body: commands
})
    .then(() => {
        console.log('the commands were successfully registered')
    })
    .catch(() => {
        console.log('there was an error when registering the commands')
    })