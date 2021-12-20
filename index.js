const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config()

const { 
    Client, 
    Intents, 
    Constants, 
    Collection
} = require('discord.js')

const { Client: dbClient } = require('pg')

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.dbClient = new dbClient({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DBDATABASE
})
client.dbClient.connect()

client.commands = new Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.data.name, command)
}

for (const file of eventFiles) {
    const event = require(`./events/${file}`)
    const { name, once, execute } = event

    if (once) {
        client.once(name, (...args) => execute(...args))
    } else {
        client.on(name, (...args) => execute(...args))
    }
}

client.login(process.env.TOKEN)