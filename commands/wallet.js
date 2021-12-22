const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('wallet related commands: view')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your balance')
        ),
    async execute(interaction) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important variables about user 
        const username = interaction.user.username
        const userID = interaction.user.id 
        
        // View user's current balance 
        if (interaction.options.getSubcommand() === 'view') {
            dbClient.query(`SELECT balance FROM users WHERE discord_id=${userID}`, (err,res) => {
                if (err) throw err

                const balance = res.rows[0].balance

                const embed = {
                    color: '#ff63ce',
                    title: `${username}'s Wallet`,
                    description: 'View how much money you have!',
                    author: {
                        name: 'Room Setup Bot'
                    },
                    fields: [
                        {
                            name: '\u200B',
                            value: '\u200B'
                        },
                        {
                            name: 'Current balance:',
                            value: `${balance}`
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: 'Room Setup Bot'
                    }
                }
            })
        }
    }
}