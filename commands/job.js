const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageButton, Collector } = require('discord.js')
const { jobUpdate } = require('./helpers/jobUpdate.js')
const { jobMarketUpdate } = require('./helpers/jobMarketUpdate.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('job')
        .setDescription('job related commands: view, collect, market, leave')
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
        )
        .addSubcommand(subcommand => subcommand
            .setName('leave')
            .setDescription('leave your current job.')
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

            const { job_paycheck, next_hours, next_minutes, next_seconds } = q3[0]

            // Create fields for current job 
            const currentJobFields = []
            if (q1.length === 0 ) {
                currentJobFields.push(...[
                    {
                        name: 'You are currently unemployed!',
                        value: 'Visit the job market to find a new job.'
                    }
                ])
            } else {
                const { job_name, job_description, hourly_wage } = q1[0]
                currentJobFields.push(...[
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
                ])
            }

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
                    ...currentJobFields
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
                description: 'Money earned from your job!  Paycheck is automatically updated every 24 hours. To collect paycheck, use /job collect.',
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
        }   // Leave job 
        else if (interaction.options.getSubcommand() === 'leave') {
            const { rows: q1 } = await dbClient.query(`SELECT EXTRACT(day FROM NOW() - job_join_date) AS days FROM users WHERE discord_id=${userID}`)
            const days = q1[0].days

            if (days >= 3) {
                const { rows: q2 } = await dbClient.query(`UPDATE users SET job_id = NULL WHERE discord_id=${userID}`)
                interaction.reply({
                    content: `Successfully left your job, ${username}!`
                })
            } else {
                const { rows: q3 } = await dbClient.query(`SELECT job_join_date - NOW() + INTERVAL '72 hours' AS time FROM users WHERE discord_id=${userID}`)
                const hours = q3[0].time.hours
                const minutes = q3[0].time.minutes
                const seconds = q3[0].time.seconds

                interaction.reply({
                    content: `You can't quite leave your job yet, ${username}! Please wait ${hours} hours, ${minutes} minutes and ${seconds} seconds.`
                })
            }
        }   // Access the job market 
        else if (interaction.options.getSubcommand() === 'market') {
            // Check if market needs to be updated
            const { rows: q1 } = await dbClient.query(`SELECT EXTRACT(DAYS FROM NOW() - market_last_update) AS days FROM users_job_market WHERE discord_id=${userID}`)
            const { days } = q1[0]

            // If more than 5 days has passed auto update market
            if (days >= 5) {
                await jobMarketUpdate(interaction)
            } 

            // Fetch job info for jobs in user's job market
            const { rows: q2 } = await dbClient.query(`SELECT job_id, job_name, job_description, hourly_wage, minimum_net, minimum_jobs FROM users_job_market JOIN jobs ON users_job_market.job_one_id = jobs.job_id or users_job_market.job_two_id = jobs.job_id or users_job_market.job_three_id = jobs.job_id or users_job_market.job_four_id = jobs.job_id WHERE discord_id=${userID}`)
            
            // Fetch user's current job
            const { rows: q3 } = await dbClient.query(`SELECT job_id FROM users WHERE discord_id=${userID}`)

            // Check if user is able to apply for job
            // NOTE: not currently taking into account inventory value
            const { rows: q4 } = await dbClient.query(`SELECT balance FROM users WHERE discord_id=${userID}`)
            const balance = q4[0].balance

            const { rows: q5 } = await dbClient.query(`SELECT COUNT(*) FROM users_jobs WHERE discord_id=${userID}`)
            const pastJobs = q5[0].count

            const { rows: q6 } = await dbClient.query(`SELECT market_last_update - NOW() + interval '120 hours' AS time FROM users_job_market WHERE discord_id=${userID}`)
            const hours = q6[0].time.hours
            const minutes = q6[0].time.minutes
            const seconds = q6[0].time.seconds

            // Create interaction action row 
            const marketRow = new MessageActionRow()

            // Create fields for market embed
            const marketFields = []
            for (const job of q2) {
                const { job_name, job_description, hourly_wage, minimum_net, minimum_jobs } = job

                // Create button for action row 
                marketRow.addComponents(
                    new MessageButton()
                        .setCustomId(job_name)
                        .setLabel(`Apply For ${job_name}`)
                        .setStyle('PRIMARY')
                )

                marketFields.push(...[
                    {
                        name: '\u200B',
                        value: '\u200B'
                    },
                    {
                        name: 'Job title:',
                        value: job_name
                    },
                    {
                        name: 'Job description:',
                        value: job_description
                    },
                    {
                        name: 'Hourly wage:',
                        value: `${hourly_wage}$`
                    },
                    {
                        name: 'Requirements to apply:',
                        value: `Minimum net worth of ${minimum_net}$ and must have worked ${minimum_jobs} prior job(s).`
                    }
                ])
            }

            // Create embed for market 
            const marketEmbed = {
                color: '#ff63ce',
                title: `${username}'s Job Market`,
                description: `Jobs that are open for applications! Job market refreshes automatically every 5 days. Your market refreshes in: ${hours} hours, ${minutes} minutes and ${seconds} seconds.`,
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    ...marketFields
                ]
            }

            // Reply to user with embed and components
            const message = await interaction.reply({
                embeds: [ marketEmbed ],
                components: [ marketRow ],
                fetchReply: true
            })

            // Create collector to collect button interactions
            const collector = message.createMessageComponentCollector({
                componentType: 'BUTTON',
                timer: 60000
            })

            // Handle button presses, i.e user attempt to apply for job
            collector.on('collect', i => {
                // Check if user currently has job
                if (q3[0].job_id !== null) {
                    i.reply({
                        content: `You currently have a job, ${username}! Cannot apply!`,
                        ephemeral: true
                    })
                } else {
                    const jobName = i.customId
                    const job = q2.filter(job => job.job_name === jobName)[0]

                    // Check if user is elligible for application
                    // NOTE: getting syntax error here with await, using callbacks instead
                    if (balance >= parseFloat(job.minimum_net) && pastJobs >= parseFloat(job.minimum_jobs)) {
                        // Calculate success rate
                        const sr = 50 * (balance / (2 * job.minimum_net)) + 50 * (pastJobs / (2 * job.minimum_jobs))
                        const n = Math.floor(Math.random() * 100) + 1
                        const success = n <= sr

                        dbClient.query(`SELECT CASE WHEN job_one_id=${job.job_id} THEN 'job_one_id' WHEN job_two_id=${job.job_id} THEN 'job_two_id' WHEN job_three_id=${job.job_id} THEN 'job_three_id' WHEN job_four_id=${job.job_id} THEN 'job_four_id' END AS slot FROM users_job_market WHERE discord_id=${userID}`, (err,res) => {
                            const { slot } = res.rows[0]
                            
                            dbClient.query(`UPDATE users_job_market SET ${slot}=NULL WHERE discord_id=${userID}`, (err,res) => {
                                if (success) {
                                    dbClient.query(`UPDATE users SET job_id=${job.job_id}, job_last_pay=NOW(), job_join_date=NOW()`)
                                    dbClient.query(`INSERT INTO users_jobs (discord_id, job_id) VALUES ('${userID}', '${job.job_id}')`, (err, res) => {
                                        i.update({
                                            embeds: [ marketEmbed ],
                                            components: []
                                        })
                                        
                                        message.reply({
                                            content: `Congratulations ${username}! You were hired and are now a(n) ${job.job_name}!`
                                        })
                                    })
                                } else {
                                    i.update({
                                        embeds: [ marketEmbed ],
                                        components: []
                                    })
                                    
                                    message.reply({
                                        content: `Sorry ${username}! You applied, but didn't get hired.`,
                                        ephemeral: true
                                    })
                                }     
                            })
                        })
                    } else {
                        i.reply({
                            content: `Sorry ${username}! You aren't elligible to apply for ${job.job_name}!`,
                            ephemeral: true
                        })
                    }
                }
            })
        }
    }
}
