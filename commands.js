const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { Constants } = require('discord.js')
const dotenv = require('dotenv')

dotenv.config()

const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    commands.push(command.data.toJSON())
}

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