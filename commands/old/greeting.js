const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greeting')
        .setDescription('bot sends a greeting'),
    async execute(interaction) {
        const user = interaction.user.username

        await interaction.reply({
            content: `Greetings to you, ${user}!`
        }) 
    }
}