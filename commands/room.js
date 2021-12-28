const { SlashCommandBuilder } = require('@discordjs/builders')
const open = require('open')
const fs = require('fs')
const path = require('path')
const { DataResolver } = require('discord.js')

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

        // Display user's room
        if (interaction.options.getSubcommand() === 'view') {
            // Open browser with user's room
            const url = `http://${process.env.SERVERHOST}:${process.env.SERVERPORT}/room?id=${userID}`
            const childProcess = await open(url)

            // Add event listener to downloads folder 
            fs.watch(process.env.DOWNLOADDIR, (eventType, filename) => {
                console.log(`event of type ${eventType} occured! name of file is: ${filename}`)
                if (eventType === 'rename' && filename === process.env.DOWNLOADNAME) {
                    // Kill child process
                    childProcess.kill('SIGINT')

                    const filePath = path.join(process.env.DOWNLOADDIR, `/${filename}`)

                    const roomEmbed = { 
                        color: '#ff63ce',
                        title: 'Test Room',
                        description: 'Your room:',
                        author: {
                            name: 'Room Setup Bot'
                        },
                        timestamp: new Date(),
                        footer: {
                            text: 'Room Setup Bot'
                        }
                    }

                    interaction.reply({
                        embeds: [ roomEmbed ],
                        files: [
                            filePath
                        ]
                    })
                }
            })
        }
    }
}