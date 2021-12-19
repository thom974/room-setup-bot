module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        if (!interaction.isCommand()) return

        const client = interaction.client
        const command = client.commands.get(interaction.commandName)
        if (!command) return

        try {
            await command.execute(interaction)
        } catch (err) {
            console.log(err)
            await interaction.reply({ content: 'Error while executing this command!', ephemeral: true })
        }
    }
}