const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tasks')
        .setDescription('view all of your available tasks to complete!')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your available tasks.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('collect')
            .setDescription('completes the specified task and collects the money reward.')
            .addStringOption(option => option.setName('task').setDescription('the specific task you want to complete, or all.').setRequired(true).addChoice('1','task_one_id').addChoice('2','task_two_id').addChoice('3','task_three_id').addChoice('all', 'all'))
        )
        .addSubcommand(subcommand => subcommand
            .setName('refresh')
            .setDescription('refreshes tasks once they are ready.')
        ),
    async execute(interaction) {
        // dbClient 
        dbClient = interaction.client.dbClient

        // Default values for tasks
        const refreshPeriod = 6

        // Fetch import variables about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Fetch the user's current list of tasks 
        if (interaction.options.getSubcommand() === 'view') {
            // Fetch task information 
            dbClient.query(`SELECT task_one_id, task_two_id, task_three_id,
                task_one_timer - now() + interval '6 hours' AS task_one_time,
                task_two_timer - now() + interval '6 hours' AS task_two_time,
                task_three_timer - now() + interval '6 hours' AS task_three_time
                FROM users_tasks WHERE discord_id=${userID}`, (err,res) => {

                if (err) throw err
                
                const userIDs = {
                    'task_one_id': res.rows[0].task_one_id,
                    'task_two_id': res.rows[0].task_two_id,
                    'task_three_id': res.rows[0].task_three_id                    
                }

                const userTimes = {
                    'task_one_id': res.rows[0].task_one_time,
                    'task_two_id': res.rows[0].task_two_time,
                    'task_three_id': res.rows[0].task_three_time
                }

                const userCurrentTasks = []
                const userCurrentTaskIDs = Object.values(userIDs).filter(id => id !== null)
                const userCurrentTasksInfo = res.rows[0]
                const taskListings = [
                    'task_one_id',
                    'task_two_id',
                    'task_three_id'
                ]

                dbClient.query(`SELECT task_id, task_name, task_description, task_reward FROM tasks WHERE task_id IN (${userCurrentTaskIDs.length == 0 ? 'null' : userCurrentTaskIDs.join()})`, (err,res) => {
                    if (err) throw err

                    for (const taskListing of taskListings) {
                        if (userCurrentTasksInfo[taskListing] !== null) {
                            const taskID = userCurrentTasksInfo[taskListing]
                            const task = res.rows.filter(task => task.task_id == taskID)[0]

                            const taskName = task.task_name
                            const taskDescription = task.task_description
                            const taskReward = task.task_reward 

                            userCurrentTasks.push(...[
                                {
                                    name: `Task name`,
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
                                    value: taskReward + '$',
                                    inline: true 
                                },
                                {
                                    name: '\u200B',
                                    value: '\u200B'
                                }
                            ])
                        } else {
                            const hours = userTimes[taskListing].hours
                            const minutes = userTimes[taskListing].minutes
                            const seconds = userTimes[taskListing].seconds

                            // Check if task is ready for refresh
                            if (hours > 0) {
                                userCurrentTasks.push(...[
                                    {
                                        name: 'Already completed this task!',
                                        value: `Check back in: ${hours} hours, ${minutes} minutes and ${seconds} seconds!`
                                    },
                                    {
                                        name: '\u200B',
                                        value: '\u200B'
                                    }
                                ])
                            } else {
                                userCurrentTasks.push(...[
                                    {
                                        name: 'Task is ready for refresh!',
                                        value: `To get a new task: /tasks refresh`
                                    },
                                    {
                                        name: '\u200B',
                                        value: '\u200B'
                                    }
                                ])
                            }
                        }
                        
                    }
                    
                    const embed = {
                        color: '#ff63ce',
                        title: `${username}'s Tasks`,
                        description: `Complete these tasks to earn money! Tasks refresh every ${refreshPeriod} hours. To refresh your tasks, use the command /tasks refresh`,
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
        
                    interaction.reply({ embeds: [ embed ] })
                })
            })
        } // Allow user to collect task, remove task from db and add to balance
        else if (interaction.options.getSubcommand() === 'collect') {
            const task = interaction.options.getString('task')

            // User collects all money
            if (task === 'all') {
                // Delete tasks user has 
                dbClient.query(`SELECT SUM(task_reward) FROM users_tasks JOIN tasks 
                    ON(users_tasks.task_one_id = tasks.task_id or users_tasks.task_two_id = tasks.task_id 
                    or users_tasks.task_three_id = tasks.task_id)
                    WHERE discord_id=${userID}`, (err,res) => {
                    
                    if (err) throw err
                    
                    if (res.rows[0].sum === null) {
                        interaction.reply({
                            content: `You don't have any tasks to collect from, ${username}!`,
                            ephemeral: true
                        })
                    } else {
                        const total = res.rows[0].sum

                        dbClient.query(`UPDATE users SET balance = balance + ${total} WHERE discord_id=${userID}`, (err, res) => {
                            if (err) throw err

                            interaction.reply({
                                content: `Collected a total of ${total}$!`,
                                ephemeral: true
                            })

                            dbClient.query(`UPDATE users_tasks SET task_one_id = null, task_two_id = null, task_three_id = null,
                                task_one_timer = NOW(), task_two_timer = NOW(), task_three_timer = NOW()
                                WHERE discord_id=${userID}`, (err, res) => {
                                if (err) throw err
                            })
                        })
                    }
                })
            } else {
                dbClient.query(`SELECT ${task} FROM users_tasks WHERE discord_id=${userID}`, (err,res) => {
                    if (err) throw err

                    if (res.rows[0][task] === null) {
                        interaction.reply({
                            content: 'Already collected from this task!',
                            ephemeral: true
                        })

                        return
                    }
                    dbClient.query(`SELECT task_reward FROM users_tasks JOIN tasks ON (users_tasks.${task} = tasks.task_id)`, (err, res) => {
                        if (err) throw err

                        const total = res.rows[0].task_reward
                        dbClient.query(`UPDATE users SET balance = balance + ${total} WHERE discord_id=${userID}`, (err,res) => {
                            if (err) throw err
                            
                            const idTimeMap = {
                                task_one_id: 'task_one_timer',
                                task_two_id: 'task_two_timer',
                                task_three_id: 'task_three_timer'
                            }

                            dbClient.query(`UPDATE users_tasks SET ${task} = null, ${idTimeMap[task]}=NOW() WHERE discord_id=${userID}`, (err,res) => {
                                if (err) throw err

                                interaction.reply({
                                    content: `Collected ${total}$ from specified task!`,
                                    ephemeral: true
                                })
                            })
                        })
                    })
                })
            }
        } else if (interaction.options.getSubcommand() === 'refresh') {
            dbClient.query(`SELECT 
                NOW() - task_one_timer > interval '6 hours' AS task_one_id,
                NOW() - task_two_timer > interval '6 hours' AS task_two_id,
                NOW() - task_three_timer > interval '6 hours' AS task_three_id,
                task_one_id AS t_one,
                task_two_id AS t_two,
                task_three_id AS t_three
                FROM users_tasks WHERE discord_id=${userID}`, (err,res) => {
                    
                    if (err) throw err

                    const tasksRefresh = {
                        task_one_id: res.rows[0].task_one_id,
                        task_two_id: res.rows[0].task_two_id,
                        task_three_id: res.rows[0].task_three_id
                    }

                    const currentTasks = [
                        res.rows[0].t_one,
                        res.rows[0].t_two,
                        res.rows[0].t_three,
                    ]

                    const taskRefreshValues = Object.values(tasksRefresh)

                    if (currentTasks.every(task => task !== null) || taskRefreshValues.every(refresh => refresh === false)) {
                        interaction.reply({
                            content: `You don't have any tasks to refresh, ${username}!`,
                            ephemeral: true
                        })

                        return
                    }

                    dbClient.query(`SELECT task_id FROM tasks`, (err,res) => {
                        if (err) throw err
                        
                        const availableTasks = res.rows.map(task => task.task_id)
                        const choices = []
                        
                        for (const task of Object.values(tasksRefresh)) {
                            if (task) {
                                n = -1

                                while (n < 0 || choices.includes(n)) {
                                    n = Math.floor(Math.random() * (availableTasks.length - 1)) + 1
                                }

                                choices.push(n)
                            }
                        }

                        let queryFields = []
                        for (const task of Object.keys(tasksRefresh)) {
                            if (tasksRefresh[task]) {
                                queryFields.push(`${task}=${choices[0]}`)
                                choices.splice(0,1)
                            }
                        }

                        dbClient.query(`UPDATE users_tasks SET ${queryFields.join()} WHERE discord_id=${userID}`, (err, res) => {
                            if (err) throw err

                            interaction.reply({
                                content: 'Successfully refreshed tasks! To view new tasks, type /tasks view'
                            })
                        })
                    })
            }) 
        }
    }
}