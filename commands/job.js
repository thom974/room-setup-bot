const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('job')
        .setDescription('job related commands: view, collect, market')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('view your job statistics.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('collect')
            .setDescription('collect job earnings.')
        )
        .addSubcommand(subcommand => subcommand
            .setName('market')
            .setDescription('view your current job market!')
        ),
    async execute(interaction) {
        
    }
}