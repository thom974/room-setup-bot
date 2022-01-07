const { SlashCommandBuilder } = require('@discordjs/builders')
const { roomUpdate } = require('./helpers/roomUpdate.js')
const axios = require('axios').default
const fs = require('fs')
const path = require('path')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('room')
        .setDescription('room related commands: view')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your room.')
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

        // Defer reply
        await interaction.deferReply()

        // Display user's room
        if (interaction.options.getSubcommand() === 'view') {
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
        }
    }
}