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

            // Update user room update state
            const { rows: q2 } = await dbClient.query(`UPDATE users SET room_needs_update = false WHERE discord_id=${userID}`)
            
            // Fetch user's net worth
            const { rows: q3 } = await dbClient.query(`SELECT SUM(item_value) FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID}`)
            const netWorth = q3[0].sum

            const infoEmbed = {
                color: '#ff63ce',
                title: `${username}'s Room!`,
                description: 'Your statistics:',
                author: {
                    name: 'Room Setup Bot'
                },
                fields: [
                    {
                        name: 'Net worth: ',
                        value: `${netWorth}$`
                    },
                    {
                        name: 'More details soon...',
                        value: `...`
                    },
                ],
                image: {
                    url: `attachment://${process.env.DOWNLOADNAME}`
                },
                timestamp: new Date(),
                footer: {
                    text: 'Room Setup Bot'
                }
            }

            await interaction.editReply({
                embeds: [infoEmbed],
                files: [
                    {
                        attachment: userStorageDir,
                        name: process.env.DOWNLOADNAME
                    }
                ]
            })

            // await interaction.editReply({
            //     content: 'Your room!',
            //     files: [
            //         userStorageDir
            //     ]
            // })

            resolve(true)
        }

        if (needsUpdate) {
            // Fetch user items
            const { rows: q3 } = await dbClient.query(`SELECT item_path, item_style FROM users_items JOIN items USING(item_id) WHERE discord_id=${userID} AND item_active=true`)
            const itemPaths = q3.map(item => item.item_style === null ? item.item_path : [item.item_path.slice(0, item.item_path.indexOf('.')), `_${item.item_style}`, item.item_path.slice(item.item_path.indexOf('.'))].join(''))
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