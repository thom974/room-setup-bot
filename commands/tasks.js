const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tasks')
        .setDescription('view all of your available tasks to complete!'),
    async execute(interaction) {
        // dbClient 
        dbClient = interaction.client.dbClient

        // Default values for tasks
        const refreshPeriod = 3

        // Fetch import variables about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Fetch task information 
        let userCurrentTaskIDs = []
        dbClient.query(`SELECT task_id FROM users_tasks WHERE discord_id=${userID}`, (err,res) => {
            if (err) throw err
            userCurrentTaskIDs = res.rows.map(task => task.task_id)
            
            const userCurrentTasks = []
            dbClient.query(`SELECT task_name, task_description, task_reward FROM tasks WHERE task_id IN (${userCurrentTaskIDs.join()})`, (err,res) => {
                if (err) throw err

                for (let i=0; i<res.rows.length; i++) {
                    const taskName = res.rows[i].task_name
                    const taskDescription = res.rows[i].task_description
                    const taskReward = res.rows[i].task_reward

                    userCurrentTasks.push(...[
                        {
                            name: 'Task name',
                            value: taskName,
                            inline: true 
                        },
                        {
                            name: 'Task description',
                            value: taskDescription,
                            inline: true
                        },
                        {
                            name: 'Task reward',
                            value: taskReward,
                            inline: true 
                        },
                        {
                            name: '\u200B',
                            value: '\u200B'
                        }
                    ])
                }
                
                console.log(userCurrentTasks)

                const embed = {
                    color: '#ff63ce',
                    title: `${username}'s Tasks`,
                    description: `Complete these tasks to earn money! Tasks refresh every ${refreshPeriod} hours!`,
                    author: {
                        name: 'Room Setup Bot',
                    },
                    fields: [
                        {
                            name: '\u200B',
                            value: '\u200B'
                        },
                        ...userCurrentTasks
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: 'Room Setup Bot'
                    }
                }
    
                interaction.reply({ embeds: [embed] })
            })
        })
    }
}