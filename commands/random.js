const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('gives a random number in the specified range, inclusive')
        .addNumberOption(option => option
            .setName('lower')
            .setDescription('the lower bound of the range')
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName('upper')
            .setDescription('the upper bound of the range')
            .setRequired(true)
        ),
    async execute(interaction) {
        const options = interaction.options
        const lower = Math.min(options.getNumber('lower'), options.getNumber('upper'))
        const upper = Math.max(options.getNumber('upper'), options.getNumber('lower'))
        const random = Math.floor(Math.random() * (upper - lower + 1)) + lower
        
        await interaction.reply({
            content: `Your random number is: ${random}!`
        })
    }
    
}