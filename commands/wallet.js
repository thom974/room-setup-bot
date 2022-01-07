const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('axios').default

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
        const userTag = interaction.user.tag
        const userAvatar = interaction.user.displayAvatarURL()
        const userInfo = await axios.get(`https://discord.com/api/users/${userID}`, {
            headers: {
                Authorization: `Bot ${interaction.client.token}`
            }
        })
        const userColor = userInfo.data.accent_color 
        
        // View user's current balance 
        if (interaction.options.getSubcommand() === 'view') {
            const { rows } = await dbClient.query(`SELECT balance FROM users WHERE discord_id=${userID}`)
            const balance = rows[0].balance

            embed = {
                color: userColor,
                title: `${username}'s Wallet`,
                description: 'View your financial stats!',
                author: {
                    name: `${userTag}`, 
                    iconURL: `${userAvatar}`
                },
                fields: [
                    {
                        name: '\u200B',
                        value: `**Current balance**: \n${balance}$\n\u200B`
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