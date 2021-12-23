const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageButton, Collector } = require('discord.js')
const { jobUpdate } = require('./helpers/jobUpdate.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('job')
        .setDescription('job related commands: view, collect, market')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your job statistics.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('collect')
            .setDescription('collect job earnings.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('market')
            .setDescription('view your current job market!')
        ),
    async execute(interaction) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important variables about user 
        const username = interaction.user.username
        const userID = interaction.user.id

        // Update paycheck if needed
        jobUpdate(interaction)

        // Display current job statistics for user 
        if (interaction.options.getSubcommand() === 'view') {
            const { rows: q1 } = await dbClient.query(`SELECT job_name, job_description, hourly_wage FROM users JOIN
                jobs USING (job_id) WHERE discord_id=${userID}`)
            
            const { rows: q2 } = await dbClient.query(`SELECT job_name, job_description, hourly_wage FROM users JOIN jobs USING(job_id) WHERE discord_id=${userID}`)
            const { rows: q3 } = await dbClient.query(`SELECT CAST(EXTRACT(HOUR FROM job_last_pay - NOW() + interval '24 hours') AS INT) % 24 AS next_hours,
                CAST(EXTRACT(MINUTE FROM job_last_pay - NOW() + interval '24 hours') AS INT) % 1440 AS next_minutes,
                CAST(EXTRACT(SECOND FROM job_last_pay - NOW() + interval '24 hours') AS INT) % 86400 AS next_seconds,
                job_paycheck
                FROM users WHERE discord_id=${userID}`)

            const { job_name, job_description, hourly_wage } = q1[0]
            const { job_paycheck, next_hours, next_minutes, next_seconds } = q3[0]

            // Create fields for each job in job history 
            const jobFields = []
            for (const job of q2) {
                jobFields.push({
                    name: 'Job title:',
                    value: `${job.job_name}`,
                    inline: true
                }, {
                    name: 'Job description:',
                    value: `${job.job_description}`,
                    inline: true
                }, 
                {
                    name: 'Hourly wage',
                    value: `${job.hourly_wage}$`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: false
                })
            }

            // Embed to display current job stats
            const currentEmbed = {
                color: '#ff63ce',
                title: `${username}'s Job Statistics`,
                description: 'View info about your employment!',
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    {
                        name: 'Current job:',
                        value: `${job_name}`
                    },
                    {
                        name: 'Job description:',
                        value: `${job_description}`
                    },
                    {
                        name: 'Hourly wage:',
                        value: `${hourly_wage}$`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            // Embed to display past employment stats
            const pastEmbed = {
                color: '#ff63ce',
                title: `${username}'s Past Jobs`,
                description: 'Your full employment history:',
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    {
                        name: '\u200B',
                        value: '\u200B'
                    },
                    ...jobFields
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            // Embed to display job pay stats
            const payEmbed = {
                color: '#ff63ce',
                title: `${username}'s Paycheck`,
                description: 'Money earned from your job! You can use /job collect once every 24 hours to add to your paycheck.',
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    {
                        name: 'Amount in paycheck:',
                        value: `${job_paycheck}$`
                    },
                    {
                        name: 'Your next pay is in:',
                        value: `${next_hours} hours, ${next_minutes} minutes and ${next_seconds} seconds!`
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            // Button row 
            const currentRow = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('current')
                        .setLabel('Current')
                        .setStyle('PRIMARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('past')
                        .setLabel('Job History')
                        .setStyle('PRIMARY')
                        .setDisabled(false),
                    new MessageButton()
                        .setCustomId('pay')
                        .setLabel('Paycheck')
                        .setStyle('SUCCESS')
                        .setDisabled(false)
                )
            
            const pastRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('current')
                    .setLabel('Current')
                    .setStyle('PRIMARY')
                    .setDisabled(false),
                new MessageButton()
                    .setCustomId('past')
                    .setLabel('Job History')
                    .setStyle('PRIMARY')
                    .setDisabled(true),
                new MessageButton()
                    .setCustomId('pay')
                    .setLabel('Paycheck')
                    .setStyle('SUCCESS')
                    .setDisabled(false)
            )

            const payRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('current')
                    .setLabel('Current')
                    .setStyle('PRIMARY')
                    .setDisabled(false),
                new MessageButton()
                    .setCustomId('past')
                    .setLabel('Job History')
                    .setStyle('PRIMARY')
                    .setDisabled(false),
                new MessageButton()
                    .setCustomId('pay')
                    .setLabel('Paycheck')
                    .setStyle('SUCCESS')
                    .setDisabled(true)
            )
            
            // Reply to user with embed message and buttons 
            const message = await interaction.reply({ 
                embeds: [ currentEmbed ], 
                components: [ currentRow ],
                fetchReply: true
            })

            // Create interaction collector to collect only button interactions
            const collector = message.createMessageComponentCollector({
                componentType: 'BUTTON',
                time: 60000     // Collector runs for 60 sec
            })

            collector.on('collect', i => {
                if (i.customId === 'current') {
                    i.update({
                        embeds: [ currentEmbed ],
                        components: [ currentRow ]
                    })
                } else if (i.customId === 'past') {
                    i.update({
                        embeds: [ pastEmbed ],
                        components: [ pastRow ]
                    })
                } else if (i.customId === 'pay') {
                    i.update({
                        embeds: [ payEmbed ],
                        components: [ payRow ]
                    })
                }
            })
        }   // Collect money from paycheck
        else if (interaction.options.getSubcommand() === 'collect') {
            const { rows: q1 } = await dbClient.query(`SELECT job_paycheck FROM users WHERE discord_id=${userID}`)
            const pay = q1[0].job_paycheck

            if (pay > 0) {
                const { rows: q2 } = await dbClient.query(`UPDATE users SET balance = balance + ${pay}, job_paycheck = 0 WHERE discord_id=${userID}`)

                interaction.reply({
                    content: `Collected ${pay}$ from paycheck and added it to your wallet, ${username}!`
                })
            } else {
                interaction.reply({
                    content: `You don't have any money to collect from your paycheck, ${username}!`,
                    ephemeral: true
                })
            }
        }
    }
}