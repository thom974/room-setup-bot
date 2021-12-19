const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('learn more about the bot and its commands!'),
    async execute(interaction) {
        const embed = {
            color: '#ff63ce',
            title: 'Welcome to Room Setup Bot!',
            description: 'Learn more about the bot\'s features and view a list of available commands.',
            author: {
                name: 'Room Setup Bot',
            },
            fields: [
                { 
                    name: '\u200B', 
                    value: '\u200B' 
                },
                {
                    name: 'Summary',
                    value: 'Design your very own customized room setup! Collect money from working, tasks and events to upgrade your equipment!'
                },
                { 
                    name: '\u200B', 
                    value: '\u200B' 
                },
                {
                    name: 'Commands',
                    value: 'View available commands by category.'
                },
                { 
                    name: '\u200B', 
                    value: '\u200B' 
                },
                {
                    name: 'Inline field title',
                    value: 'Some value here',
                    inline: true,
                },
                {
                    name: 'Inline field title',
                    value: 'Some value here',
                    inline: true,
                },
                {
                    name: 'Inline field title',
                    value: 'Some value here',
                    inline: true,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: 'Room Setup Bot'
            }
        }

        interaction.reply({ embeds: [embed] })
    }
}