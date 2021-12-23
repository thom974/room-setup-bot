module.exports = {
    async jobMarketUpdate(interaction) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important variables about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Fetch user's current job 
        const { rows: q1 } = await dbClient.query(`SELECT job_id FROM users JOIN jobs USING(job_id) WHERE discord_id=${userID}`)
        const currentJob = q1[0].job_id 
        
        // Generate 4 random jobs from jobs db 
        const { rows: q2 } = await dbClient.query(`SELECT job_id FROM jobs`)
        const jobIDs = q2.map(job => job.job_id)
        const newJobs = []

        for (let i=0; i<4; i++) {
            let n = -1

            while (n < 0 || newJobs.includes(n) || n === currentJob) {
                n = jobIDs[Math.floor(Math.random() * jobIDs.length)]
            }
            newJobs.push(n)
        }
        
        // Create new record if discord_id doesn't exist, as this func. is run on /start
        const { rows: q3 } = await dbClient.query(`SELECT discord_id FROM users_job_market WHERE discord_id=${userID}`)
        // If user not in users_job_market, insert new record
        if (q3.length === 0) {
            const { rows: q4 } = await dbClient.query(`INSERT INTO users_job_market (discord_id, job_one_id, job_two_id, job_three_id, job_four_id, market_last_update)
            VALUES ('${userID}', '${newJobs[0]}', '${newJobs[1]}', '${newJobs[2]}', '${newJobs[3]}', NOW())`)
        } else {
            const { rows: q4 } = await dbClient.query(`UPDATE users_job_market SET job_one_id=${newJobs[0]}, job_two_id=${newJobs[1]}, job_three_id=${newJobs[2]}, job_four_id=${newJobs[3]}, market_last_update=NOW() WHERE discord_id=${userID}`)
        }
    }
}   