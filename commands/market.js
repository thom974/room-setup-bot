const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('axios').default

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('market related commands: view, viewitem')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view the specified item market. market types: bed, chair, desk, computer, keyboard, monitor, decor')
            .addStringOption(option => option.setName('market_type').setDescription('the name of the market').setRequired(true).addChoice('bed', 'bed').addChoice('chair', 'chair').addChoice('desk', 'desk').addChoice('computer', 'computer').addChoice('keyboard', 'keyboard').addChoice('monitor', 'monitor').addChoice('decor', 'decor'))
        ),
    async execute(interaction) {
        // dbClient 
        const dbClient = interaction.client.dbClient

        // Fetch important info about user
        const userID = interaction.user.id
        const username = interaction.user.username
        const userTag = interaction.user.tag
        const userAvatar = interaction.user.displayAvatarURL()
        const userInfo = await axios.get(`https://discord.com/api/users/${userID}`, {
            headers: {
                Authorization: `Bot ${interaction.client.token}`
            }
        })
        const userColor = userInfo.data.accent_color

        if (interaction.options.getSubcommand() === 'view') {
            const marketType = interaction.options.getString('market_type')

            // Decoration market has several types of items (e.g decor_1, decor_desk, etc)
            let q1
            if (marketType !== 'decor') {
                q1 = await dbClient.query(`SELECT * FROM items WHERE item_type='${marketType}' AND item_id>9`)
            } else {
                q1 = await dbClient.query(`SELECT * FROM items WHERE (item_type ='decor_1' OR item_type='decor_desk') AND item_id>9`)
            }

            // Create field for each item fetched from market
            const marketFields = []
            for (let i = 0; i < q1.rows.length; i++) {
                marketFields.push({
                    name: '\u200B',
                    value: `**Item name**: \n${q1.rows[i].item_name}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `**Cost**: \n${q1.rows[i].item_value}$${i === q1.rows.length - 1 ? '\n\u200B' : ''}`,
                    inline: true
                })
            }

            const marketEmbed = {
                color: userColor,
                title: `${marketType.charAt(0).toUpperCase() + marketType.substr(1)} Market`,
                description: '',
                author: {
                    name: `${userTag}`, 
                    iconURL: `${userAvatar}`
                },
                fields: [
                    ...marketFields
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            interaction.reply({
                embeds: [marketEmbed]
            })
        }
    }
}