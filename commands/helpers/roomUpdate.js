const open = require('open')
const fs = require('fs')
const path = require('path')
const { resolve } = require('path')
const { rejects } = require('assert')

module.exports = {
    async roomUpdate(interaction, resolve, reject) {
        // dbClient
        const dbClient = interaction.client.dbClient

        // Fetch important information about user
        const userID = interaction.user.id
        const username = interaction.user.username

        // Check if room needs update 
        const { rows: q1 } = await dbClient.query(`SELECT room_needs_update AS update FROM users WHERE discord_id=${userID}`)
        const needsUpdate = q1[0].update

        // Util async function
        const reply = async (interaction, filePath) => {
            // Move file into storage
            const userStorageDir = path.join(process.env.STORAGEDIR, `${userID}`, process.env.DOWNLOADNAME)
            fs.rename(filePath, userStorageDir, (err) => {
                if (err) throw err
            })

            const { rows: q2 } = await dbClient.query(`UPDATE users SET room_needs_update = false WHERE discord_id=${userID}`)

            await interaction.editReply({
                content: 'Your room!',
                files: [
                    userStorageDir
                ]
            })

            resolve(true)
        }

        if (needsUpdate) {
            // Fetch user items
            const { rows: q3 } = await dbClient.query(`SELECT item_path FROM users_items JOIN items USING(item_id) WHERE discord_id=583812176280551429 AND item_active=true`)
            const itemPaths = q3.map(item => item.item_path)
            const itemQuery = `&items=${itemPaths.join()}`

            // Open browser with user's room
            const url = `http://${process.env.SERVERHOST}:${process.env.SERVERPORT}/room?id=${userID}${itemQuery}`
            const childProcess = await open(url, { app: { name: 'chrome' }})
            let replied = false

            setTimeout(() => {
                if (!replied) {
                    interaction.editReply('There was an issue rendering your room! Try again.')
                    reject('error')
                }
            }, 5000)

            // Add event listener to downloads folder 
            // Event listener will be active for 5 sec as window closes after 5 sec
            fs.watch(process.env.DOWNLOADDIR, (eventType, filename) => {
                if (eventType === 'rename' && filename === process.env.DOWNLOADNAME) {
                    const filePath = path.join(process.env.DOWNLOADDIR, `${filename}`)
                    
                    if (!replied) {
                        setTimeout(() => {
                            reply(interaction, filePath)
                        }, 200)
                    }
                    
                    replied = true
                }
            })
        } else {
            resolve(false)
        }
    }
}