const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config()

const { 
    Client, 
    Intents, 
    Constants, 
    Collection
} = require('discord.js')

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.commands = new Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.data.name, command)
}

client.on('ready', () => {
    console.log('the bot is online.')

    // ---- COMMANDS ARE NOW REGISTERED FROM commands.js ----
    // // access Guild object from GuildManager object, which is a collection (map)
    // const guildID = '583816025259245694'
    // const guild = client.guilds.cache.get(guildID)

    // // if valid Guild obtained, set commands for that Guild 
    // const commands = guild ? guild.commands : client.application.commands

    // // add commands for Guild 
    // commands.create({
    //     name: 'greeting',
    //     description: 'bot sends a greeting'
    // })

    // commands.create({
    //     name: 'random',
    //     description: 'gives a random number in the specified range, inclusive',
    //     options: [
    //         {
    //             name: 'lower',
    //             description: 'the lower bound of the range',
    //             required: true,
    //             type: Constants.ApplicationCommandOptionTypes.NUMBER
    //         },
    //         {
    //             name: 'upper',
    //             description: 'the upper bound of the range',
    //             required: true,
    //             type: Constants.ApplicationCommandOptionTypes.NUMBER
    //         }
    //     ]
    // })
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    try {
        await command.execute(interaction)
    } catch (err) {
        console.log(err)
        await interaction.reply({ content: 'Error while executing this command!', ephemeral: true })
    }
})

client.login(process.env.TOKEN)