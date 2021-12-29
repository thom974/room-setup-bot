const { SlashCommandBuilder } = require('@discordjs/builders')
const { jobMarketUpdate } = require('./helpers/jobMarketUpdate')
const fs = require('fs')
const path = require('path')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('run this command to get started with the bot!'),
    async execute(interaction) {
        // Fetch the database client
        const dbClient = interaction.client.dbClient
        
        // Fetch important variables about user
        const username = interaction.user.username
        const userID = interaction.user.id

        // Default starting values for a new user
        const balance = 0   // $0 dollars
        const paycheck = 0  // $0 dollars
        const jobID = 1     // Starting job "Cashier"

        const { rows: q1 }  = await dbClient.query(`SELECT discord_id FROM users WHERE discord_id=${userID}`)
        
        if (!q1.length) {
            // Add record to 'users' table 
            const { rows: q2 } = await dbClient.query(`INSERT INTO users (discord_id, balance, job_id, join_date, job_last_pay, job_paycheck, job_join_date, room_needs_update) 
                VALUES ('${userID}', '${balance}', '${jobID}', NOW(), NOW(), '${paycheck}', NOW(), 'true')`)
                
            // Assign three random tasks 
            const { rows: q3 } = await dbClient.query(`SELECT task_id FROM tasks`)

            const availableTasks = q3.map(task => task.task_id)
                
            // Fetch three random tasks with no overlap, (make cleaner?)
            const choices = []
            for (let i=0; i<3; i++) {
                let n = -1

                while (n < 0 || choices.includes(n)) {
                    n = Math.floor(Math.random() * (availableTasks.length - 1)) + 1
                }

                choices.push(n)
            }

            // Add tasks to user_tasks table 
            const { rows: q4 } = await dbClient.query(`INSERT INTO users_tasks (discord_id, task_one_id, task_two_id, task_three_id)
                VALUES ('${userID}', '${choices[0]}', '${choices[1]}','${choices[2]}')`)
            
            // Add default job to users_jobs table 
            const { rows: q5 } = await dbClient.query(`INSERT INTO users_jobs (discord_id, job_id) VALUES
            ('${userID}', '${jobID}')`)
            
            // Add jobs to job market
            jobMarketUpdate(interaction)

            // Add room code to disk storage
            const storageDir = process.env.STORAGEDIR
            const userStorageDir = path.join(storageDir, `${userID}`)

            fs.mkdir(userStorageDir, (err) => {     // Make new folder for user in disk storage
                if (err) throw err
            })    

            fs.copyFile('db/templates/room.js', path.join(userStorageDir, 'room.js'), (err) => {
                if (err) throw err
            })

            fs.copyFile('db/templates/items.json', path.join(userStorageDir, 'items.json'), (err) => {
                if (err) throw err
            })

            await interaction.reply({
                content: `Welcome aboard, ${username}!` 
            })

        } else {
            interaction.reply({
                content: `You've already registered your account, ${username}!`,
                ephemeral: true 
            })
        }
    }
}