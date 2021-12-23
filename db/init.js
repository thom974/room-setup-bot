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

const addJobs = async () => {
    // await client.query('DELETE FROM jobs')

    // await client.query('ALTER SEQUENCE jobs_job_id_seq RESTART')

    for (const job of jobs) {
        const { rows: q1} = await client.query(`SELECT job_name FROM jobs WHERE job_name='${job.job_name}'`)

        // if (q1.length === 0) {
        //     await client.query(`INSERT INTO jobs (job_name, job_description, hourly_wage, minimum_net, minimum_jobs) 
        //     VALUES ('${job.job_name}', '${job.job_description}', '${job.hourly_wage.toFixed(2)}', '${job.minimum_net}', '${job.minimum_jobs}')`)
        // }
        console.log(job)
        await client.query(`UPDATE jobs SET minimum_net = ${job.minimum_net}, minimum_jobs = ${job.minimum_jobs} WHERE job_name='${job.job_name}'`)
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
