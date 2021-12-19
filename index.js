const dotenv = require('dotenv')
dotenv.config()

const { Client, Intents } = require('discord.js')

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', () => {
    console.log('the bot is online.')
})

client.on('messageCreate', (message) => {
    if (!message.author.bot) {
        const channel = message.channel
        const user = message.author.username
        const content = message.content 
        
        channel.send(`${user} sent a message: ${content}`)
    } 
})

client.login(process.env.TOKEN)