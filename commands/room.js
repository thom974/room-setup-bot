const { SlashCommandBuilder } = require('@discordjs/builders')
const { roomUpdate } = require('./helpers/roomUpdate.js')
const axios = require('axios').default
const fs = require('fs')
const path = require('path')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('room')
        .setDescription('room related commands: view, place')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your room.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('place')
            .setDescription('place furnishings down in your room.')
            .addNumberOption(option => option
                .setName('item_id')
                .setDescription('the id of the furnishing you want to place.')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        // dbClient 
        const dbClient = interaction.client.dbClient

        // Fetch import variables about user
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

        // Display user's room
        if (interaction.options.getSubcommand() === 'view') {
            // Defer reply
            await interaction.deferReply()

            // Check if room needs to be updated
            const promise = new Promise((resolve, reject) => {
                roomUpdate(interaction, resolve, reject)
            })

            // Fetch user's net worth
            const { rows: q1 } = await dbClient.query(`SELECT SUM(item_value) FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND  item_active=true`)
            const netWorth = q1[0].sum

            // Otherwise display user's current room
            promise.then(bool => {
                if (!bool) {
                    const roomPath = path.join(process.env.STORAGEDIR, `${userID}`, process.env.DOWNLOADNAME)
                    
                    const infoEmbed = {
                        color: userColor,
                        title: `${username}'s Room`,
                        description: `Your room stats!`,
                        author: {
                            name: `${userTag}`, 
                            iconURL: `${userAvatar}`
                        },
                        fields: [
                            {
                                name: '\u200B',
                                value: `**Current room value**: \n${netWorth}$`
                            }
                        ],
                        image: {
                            url: `attachment://${process.env.DOWNLOADNAME}`
                        },
                        timestamp: new Date(),
                        footer: {
                            text: 'Room Setup Bot'
                        }
                    }

                    interaction.editReply({
                        embeds: [infoEmbed],
                        files: [
                            {
                                attachment: roomPath,
                                name: process.env.DOWNLOADNAME
                            }
                        ]
                    })
                }
            })
        } else if (interaction.options.getSubcommand() === 'place') {
            const itemPlaced = interaction.options.getNumber('item_id')

            // Check if user owns furnishing 
            const { rows: q1 } = await dbClient.query(`SELECT item_name FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_id=${itemPlaced}`)

            if (q1.length === 0) {
                await interaction.reply({
                    content: `You don't own that furnishing, ${username}!`,
                    ephemeral: true
                })

                return 
            }

            // Check if furnishing is already active
            const { rows: q7 } = await dbClient.query(`SELECT item_active FROM users_items WHERE discord_id=${userID} AND item_id=${itemPlaced}`)
            
            if (q7[0].item_active) {
                interaction.reply({
                    content: `You currently have that furnishing placed, ${username}!`,
                    ephemeral: true 
                })

                return
            }

            const itemName = q1[0].item_name

            // If furnishing owned, set its active state to true 
            const { rows: q2 } = await dbClient.query(`UPDATE users_items SET item_active = true WHERE discord_id=${userID} AND item_id=${itemPlaced}`)

            // Set item_active = false for currently active furnishing of same type as itemPlaced
            const { rows: q3 } = await dbClient.query(`SELECT item_type FROM items WHERE item_id=${itemPlaced}`)
            const itemType = q3[0].item_type

            const { rows: q4 } = await dbClient.query(`SELECT item_id, item_name FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_type='${itemType}' AND item_active=true`)
            const activeItemID = q4[0].item_id
            const activeItemName = q4[0].item_name

            const { rows: q5 } = await dbClient.query(`UPDATE users_items SET item_active = false WHERE discord_id=${userID} AND item_id=${activeItemID}`)
            
            // Update room_needs_update for user
            const { rows: q6 } = await dbClient.query(`UPDATE users SET room_needs_update = true WHERE discord_id=${userID}`)

            interaction.reply({
                content: `Successfully placed \`${itemName}\`, removing your old furnishing \`${activeItemName}\`!`
            })
        }
    }
}