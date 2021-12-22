const { SlashCommandBuilder } = require('@discordjs/builders')

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
        const jobID = 1     // Starting job "Cashier"

        dbClient.query(`SELECT discord_id FROM users WHERE discord_id=${userID}`, (err, res) => {
            if (err) throw err
            
            // Check if user already in database
            if (!res.rows.length) {
                // Add record to 'users' table 
                dbClient.query(`INSERT INTO users (discord_id, balance, job_id, join_date) 
                    VALUES ('${userID}', '${balance}', '${jobID}', NOW())`, (err, res) => {
                        if (err) throw err

                        interaction.reply({
                            content: `Welcome aboard, ${username}!` 
                        })
                    })

                // Assign three random tasks 
                dbClient.query(`SELECT task_id FROM tasks`, (err, res) => {
                    if (err) throw err

                    const availableTasks = res.rows.map(task => task.task_id)
                    
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
                    
                    dbClient.query(`INSERT INTO users_tasks (discord_id, task_one_id, task_two_id, task_three_id)
                        VALUES ('${userID}', '${choices[0]}', '${choices[1]}','${choices[2]}')`, (err, res) => {
                            if (err) throw err
                    })
                })

            } else {
                interaction.reply({
                    content: `You've already registered your account, ${username}!`,
                    ephemeral: true 
                })
            }
        })
    }
}