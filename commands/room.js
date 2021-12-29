const { SlashCommandBuilder } = require('@discordjs/builders')
const { roomUpdate } = require('./helpers/roomUpdate.js')
const fs = require('fs')
const path = require('path')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('room')
        .setDescription('room related commands: view')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your room')
        ),
    async execute(interaction) {
        // dbClient 
        const dbClient = interaction.client.dbClient

        // Fetch import variables about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Defer reply
        await interaction.deferReply()

        // Display user's room
        if (interaction.options.getSubcommand() === 'view') {
            // Check if room needs to be updated
            const promise = new Promise((resolve, reject) => {
                roomUpdate(interaction, resolve, reject)
            })

            // Otherwise display user's current room
            promise.then(bool => {
                if (!bool) {
                    const roomPath = path.join(process.env.STORAGEDIR, `${userID}`, process.env.DOWNLOADNAME)

                    interaction.editReply({
                        content: 'Your room!',
                        files: [
                            roomPath
                        ]
                    })
                }
            })
        }
    }
}