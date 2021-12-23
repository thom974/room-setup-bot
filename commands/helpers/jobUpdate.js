module.exports = {
    async jobUpdate(interaction) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important variables about user
        const userID = interaction.user.id
        const username = interaction.user.username

        const { rows: q1 } = await dbClient.query(`SELECT CAST(EXTRACT(DAY FROM NOW() - job_last_pay) AS INT) AS days FROM users WHERE discord_id=${userID}`)
        const lastPay = q1[0].days

        if (lastPay > 0) {
            const { rows: q2 } = await dbClient.query(`SELECT hourly_wage FROM users JOIN jobs USING(job_id) WHERE discord_id=${userID}`)
            const earnedPay = lastPay * 8 * q2[0].hourly_wage

            const { rows: q3 } = await dbClient.query(`UPDATE users SET job_paycheck = job_paycheck + ${earnedPay} WHERE discord_id=${userID}`)
            const { rows: q4 } = await dbClient.query(`UPDATE users SET job_last_pay = job_last_pay + interval '${lastPay} days' WHERE discord_id=${userID}`)
        } 
    }
}
