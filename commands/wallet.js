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
            const { rows } = await dbClient.query(`SELECT balance FROM users WHERE discord_id=${userID}`)
            const balance = rows[0].balance

            embed = {
                color: '#ff63ce',
                title: `${username}'s Wallet`,
                description: 'View how much money you have!',
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    {
                        name: 'Current balance:',
                        value: `${balance}$`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            interaction.reply({
                embeds: [ embed ]
            })
        }
    }
}