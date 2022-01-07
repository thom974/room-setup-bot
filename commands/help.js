const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const axios = require('axios').default

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('learn more about the bot and its commands!'),
    async execute(interaction) {
        // Fetch user information
        const userID = interaction.user.id
        const userTag = interaction.user.tag
        const userAvatar = interaction.user.displayAvatarURL()
        const userInfo = await axios.get(`https://discord.com/api/users/${userID}`, {
            headers: {
                Authorization: `Bot ${interaction.client.token}`
            }
        })
        const userColor = userInfo.data.accent_color

        const embed = {
            color: userColor,
            title: 'Welcome to Room Setup Bot!',
            description: 'Learn more about the bot\'s features and view a list of available commands.',
            author: {
                name: `${userTag}`, 
                iconURL: `${userAvatar}`
            },
            fields: [
                {
                    name: '\u200B',
                    value: '**Summary**: \nDesign your very own customized room setup! Collect money from working, tasks and events to buy new accessories and furnishings!'
                },
                {
                    name: '\u200B',
                    value: '**Commands**: \nView available commands by category. More command info can be found when entering the command.'
                },
                {
                   name: '\u200B',
                   value: '**Start**: set up your account!\n\n`/start`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Job**: job related commands!\n\n`/job view`\n`/job collect`\n`/job market`\n`/job leave`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Inventory**: access your items!\n\n`/inventory view`\n`/inventory editstyle`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Room**: your 3D rendered room!\n\n`/room view`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Tasks**: complete your tasks for extra cash!\n\n`/tasks view`\n`/tasks collect`\n`/tasks refresh`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Wallet**: your financial stats!\n\n`/wallet view`',
                   inline: true
                },
                {
                   name: '\u200B',
                   value: '**Market**: purchase new items here!\n\n`/market view`',
                   inline: true
                }
            ],
            timestamp: new Date(),
            footer: {
                text: 'Room Setup Bot'
            }
        }

        interaction.reply({ embeds: [embed] })
    }
}