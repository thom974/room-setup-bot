const dotenv = require('dotenv')
dotenv.config()

const { 
    Client, 
    Intents, 
    Constants 
} = require('discord.js')

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', () => {
    console.log('the bot is online.')

    // access Guild object from GuildManager object, which is a collection (map)
    const guildID = '583816025259245694'
    const guild = client.guilds.cache.get(guildID)

    // if valid Guild obtained, set commands for that Guild 
    const commands = guild ? guild.commands : client.application.commands

    // add commands for Guild 
    commands.create({
        name: 'greeting',
        description: 'bot sends a greeting'
    })

    commands.create({
        name: 'random',
        description: 'gives a random number in the specified range, inclusive',
        options: [
            {
                name: 'lower',
                description: 'the lower bound of the range',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'upper',
                description: 'the upper bound of the range',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            }
        ]
    })
})

client.on('messageCreate', (message) => {
    if (!message.author.bot) {
        const channel = message.channel
        const user = message.author.username
        const content = message.content 
        
        channel.send(`${user} sent a message: ${content}`)
    } 
})

client.on('interactionCreate', async (interaction) => {

    // if the interaction emitted is NOT a command interaction, return 
    if (!interaction.isCommand()) return 

    // destructure commandName and options within Interaction object 
    const { commandName, options } = interaction

    // handle specific commands 
    if (commandName === 'greeting') {
        const channel = interaction.channel
        const user = interaction.user.username

        // channel.send(`Greetings to you, ${user}!`) <-- this displays interaction failed?
        interaction.reply({
            content: `Greetings to you, ${user}!`
        })
    } 
    else if (commandName === 'random') {
        const lower = Math.min(options.getNumber('lower'), options.getNumber('upper'))
        const upper = Math.max(options.getNumber('upper'), options.getNumber('lower'))
        const random = Math.floor(Math.random() * (upper - lower + 1)) + lower
        
        interaction.reply({
            content: `Your random number is: ${random}!`
        })
    }
})

client.login(process.env.TOKEN)