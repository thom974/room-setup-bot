const dotenv = require('dotenv')

dotenv.config()

const { Client } = require('pg')

const jobs = require('./json/jobs.json')

const client = new Client({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DBDATABASE
})

client.connect()

const addJobs = () => {
    for (const job of jobs) {
        client.query(`INSERT INTO jobs (job_name, job_description, hourly_wage) 
            VALUES ('${job.job_name}', '${job.job_description}', '${job.hourly_wage}')`,
            (err, res) => {
                if (err) throw err
                console.log(res)
            }
        )
    }
}

addJobs()