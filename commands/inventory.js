const { SlashCommandBuilder } = require('@discordjs/builders')
const { IntegrationApplication } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('access inventory related commands: view')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view the furnishings that you own.')
            .addStringOption(option => option.setName('furnishing_type').setDescription('furnishing to view.').setRequired(true).addChoice('bed', 'bed').addChoice('chair', 'chair').addChoice('desk', 'desk').addChoice('computer', 'computer').addChoice('keyboard', 'keyboard').addChoice('monitor', 'monitor').addChoice('decor', 'decor').addChoice('all','all'))
        ),
    async execute(interaction) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important info about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Decoration types 
        const decorTypes = ['decor_1', 'decor_desk']
        let decorStr = ''
        decorTypes.forEach(decorType => {
            decorStr += decorStr.length === 0 ? `item_type='${decorType}'` : ` OR item_type='${decorType}'`
        })

        if (interaction.options.getSubcommand() === 'view') {
            const itemType = interaction.options.getString('furnishing_type')

            let itemEmbed
            if (itemType !== 'all') {
                let q1 
                if (itemType === 'decor') {
                    q1 = await dbClient.query(`SELECT item_name, item_value, item_id, item_active FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND (${decorStr})`)
                } else {
                    q1 = await dbClient.query(`SELECT item_name, item_value, item_id, item_active FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} and item_type='${itemType}'`)
                }

                const itemFields = []

                q1.rows.forEach(item => {
                    if (item.item_active) {
                        itemFields.push({
                            name: `Currently active: \`${item.item_name}\`\nValue: \`${item.item_value}$\`\nID: \`${item.item_id}\``,
                            value: '\u200B'
                        })
                    }
                })

                q1.rows.forEach(item => {
                    if (!item.item_active) {
                        itemFields.push({
                            name: `\`${item.item_name}\`\nValue: \`${item.item_value}$\`\nID: \`${item.item_id}\``,
                            value: '\u200B'
                        })
                    }
                })

                const itemEmbed = {
                    color: '#ff63ce',
                    title: `${username}'s ${itemType.charAt(0).toUpperCase() + itemType.substr(1)}s`,
                    description: '\u200B',
                    author: {
                        name: 'Room Setup Bot'
                    },
                    fields: [
                        ...itemFields
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: 'Room Setup Bot'
                    }
                }

                interaction.reply({
                    embeds: [itemEmbed]
                })

            } else {
                const { rows: q1 } = await dbClient.query(`SELECT item_type, COUNT(item_type) FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} GROUP BY item_type`)
                const { rows: q2 } = await dbClient.query(`SELECT item_type, item_name FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_active=true GROUP BY item_type, item_name`)
                const itemFields = []
                const activeItems = {}

                q2.forEach(item => {
                    if (!(item.item_type.includes('decor') || item.item_type === 'room')) {
                        activeItems[item.item_type] = item.item_name
                    }
                })

                q1.forEach(item => {
                    if (!(item.item_type.includes('decor') || item.item_type === 'room')) {
                        itemFields.push({
                            name: `${item.item_type.charAt(0).toUpperCase() + item.item_type.substr(1)}s owned: \`${item.count}\`!`,
                            value: '\u200B',
                            inline: true
                        }, 
                        {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true
                        },
                        {
                            name: `Currently active: \`${activeItems[item.item_type]}\``,
                            value: '\u200B',
                            inline: true
                        })
                    }
                })

                let totalDecor = 0
                q1.filter(item => item.item_type.includes('decor')).forEach(item => {
                    totalDecor += Number(item.count)
                })

                itemFields.push({
                    name: `Decorations owned: \`${totalDecor}\`!`,
                    value: '\u200B'
                })

                itemEmbed = { 
                    color: '#ff63ce',
                    title: `${username}'s Furnishings`,
                    description: '\u200B',
                    author: {
                        name: 'Room Setup Bot'
                    },
                    fields: [
                        ...itemFields
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: 'Room Setup Bot'
                    }
                }

                interaction.reply({
                    embeds: [itemEmbed]
                })
            }
        }

    }
}