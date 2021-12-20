const dotenv = require('dotenv')

dotenv.config()

const { Client } = require('pg')

const jobs = require('./json/jobs.json')
const tasks = require('./json/tasks.json')

const client = new Client({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DBDATABASE
})

client.connect()

const addJobs = () => {
    client.query('DELETE FROM jobs', (err, res) => {
        if (err) throw err
        console.log('deleted all rows from jobs.')
    })

    client.query('ALTER SEQUENCE jobs_job_id_seq RESTART', (err, res) => {
        if (err) throw err
        console.log('restarted jobs sequence.')
    })

    for (const job of jobs) {
        client.query(`INSERT INTO jobs (job_name, job_description, hourly_wage) 
            VALUES ('${job.job_name}', '${job.job_description}', '${job.hourly_wage.toFixed(2)}')`,
            (err, res) => {
                if (err) throw err
                console.log('inserted into jobs table.')
            }
        )
    }
}

const addTasks = () => {
    client.query('DELETE FROM tasks', (err, res) => {
        if (err) throw err
        console.log('deleted all rows from tasks.')
    })

    client.query('ALTER SEQUENCE tasks_task_id_seq RESTART', (err, res) => {
        if (err) throw err
        console.log('restarted tasks sequence.')
    })

    for (const task of tasks) {
        client.query(`INSERT INTO tasks (task_name, task_description, task_reward) VALUES ('${task.task_name}', '${task.task_description.replaceAll("'", "''")}', '${Number(task.task_reward.toFixed(2))}')`,
            (err, res) => {
                if (err) throw err
                console.log('insterted into tasks table.')
            }
        )
        // console.log(`INSERT INTO tasks (task_name, task_description, task_reward) VALUES ('${task.task_name}', '${task.task_description.replaceAll("'", "''")}', '${Number(task.task_reward.toFixed(2))}')`)
    }
}


addJobs()
addTasks()