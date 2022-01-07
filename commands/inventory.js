const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('axios').default

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('access inventory related commands: view')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view the furnishings that you own.')
            .addStringOption(option => option.setName('furnishing_type').setDescription('furnishing to view.').setRequired(true).addChoice('room','room').addChoice('bed', 'bed').addChoice('chair', 'chair').addChoice('desk', 'desk').addChoice('computer', 'computer').addChoice('keyboard', 'keyboard').addChoice('monitor', 'monitor').addChoice('decor', 'decor').addChoice('all','all'))
        )
        .addSubcommand(subcommand => subcommand
            .setName('editstyle')
            .setDescription('change the style of your furnishings.')
            .addNumberOption(option => option.setName('item_id').setDescription('the id of the furnishing you want to change the style of.').setRequired(true))
            .addStringOption(option => option.setName('style').setDescription('the style you want to update your furnishing with.').setRequired(true))
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
                let q2
                if (itemType === 'decor') {
                    q1 = await dbClient.query(`SELECT item_name, item_value, item_id, item_active FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND (${decorStr})`)
                } else {
                    q1 = await dbClient.query(`SELECT item_name, item_value, item_id, item_active, item_style FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_type='${itemType}'`)
                    q2 = await dbClient.query(`SELECT item_style FROM items_styles JOIN items USING(item_id) WHERE item_type='${itemType}'`)
                }

                const itemFields = []
                const itemStyles = q2.rows.map(item => item.item_style)

                q1.rows.forEach(item => {
                    if (item.item_active) {
                        itemFields.push({
                            name: `Currently active: \`${item.item_name}${item.item_style === null ? '' : ` (style: ${item.item_style})`}\`\nValue: \`${item.item_value}$\`\nID: \`${item.item_id}\`${itemStyles.length === 0 ? '' : `\nAvailable styles: \`${itemStyles.join(', ')}\``}`,
                            value: '\u200B'
                        })
                    }
                })

                q1.rows.forEach(item => {
                    if (!item.item_active) {
                        itemFields.push({
                            name: `\`${item.item_name}${item.item_style === null ? '' : ` (style: ${item.item_style})`}\`\nValue: \`${item.item_value}$\`\nID: \`${item.item_id}\`${itemStyles.length === 0 ? '' : `\nAvailable styles: \`${itemStyles.join(', ')}\``}`,
                            value: '\u200B'
                        })
                    }
                })

                const itemEmbed = {
                    color: userColor,
                    title: `${username}'s ${itemType.charAt(0).toUpperCase() + itemType.substr(1)}s`,
                    description: '\u200B',
                    author: {
                        name: `${userTag}`, iconURL: `${userAvatar}`
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
                const { rows: q2 } = await dbClient.query(`SELECT item_type, item_name, item_style FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_active=true GROUP BY item_type, item_name, item_style`)
                const itemFields = []
                const activeItems = {}

                q2.forEach(item => {
                    if (!(item.item_type.includes('decor'))) {
                        activeItems[item.item_type] = { name: item.item_name, style: item.item_style }
                    }
                })

                q1.forEach(item => {
                    if (!(item.item_type.includes('decor'))) {
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
                            name: `Currently active: \`${activeItems[item.item_type].name}${activeItems[item.item_type].style === null ? '' : ` (style: ${activeItems[item.item_type].style})`}\``,
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
                    color: userColor,
                    title: `${username}'s Furnishings`,
                    description: '\u200B',
                    author: {
                        name: `${userTag}`,
                        iconURL: `${userAvatar}`
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
        } else if (interaction.options.getSubcommand() === 'editstyle') {
            const itemID = interaction.options.getNumber('item_id')
            const itemStyle = interaction.options.getString('style')

            // Check if user owns specified item
            const { rows: q1 } = await dbClient.query(`SELECT * FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_id=${itemID}`)

            if (q1.length === 0) {
                interaction.reply({
                    content: `You don't have that furnishing, ${username}!`,
                    ephemeral: true 
                })

                return
            } 

            // Check if attempted style change is the same as current style
            if (q1[0].item_style === itemStyle) {
                interaction.reply({
                    content: `That furnishing already has that style, ${username}!`,
                    ephemeral: true 
                })

                return
            }

            // Check if item has styles 
            const { rows: q2 } = await dbClient.query(`SELECT * FROM items_styles WHERE item_id=${itemID}`)
            if (q2.length === 0) {
                interaction.reply({
                    content: `That furnishing doesn't have styles, ${username}!`,
                    ephemeral: true 
                })

                return
            }

            // Check if specified style is available, update style if so
            const styles = q2.map(item => item.item_style)
            if (styles.includes(itemStyle)) {
                const { rows: q3 } = await dbClient.query(`UPDATE users_items SET item_style='${itemStyle}' WHERE discord_id=${userID} AND item_id=${itemID}`)
                const { rows: q4 } = await dbClient.query(`UPDATE users SET room_needs_update=true WHERE discord_id=${userID}`)
                
                interaction.reply({
                    content: `Successfully modified \`${q1[0].item_name}\` with style \`${itemStyle}\`!`
                })

            } else {
                interaction.reply({
                    content: `That furnishing doesn't have the style \`${itemStyle}\`, ${username}!`,
                    ephemeral: true 
                })
            }

            
        }

    }
}