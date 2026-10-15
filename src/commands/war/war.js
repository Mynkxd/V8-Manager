import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('war')
        .setDescription('Generate War Announcement in current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('server_ip')
                .setDescription('Server IP address')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('timing')
                .setDescription('War Timing (e.g. 8:00 PM)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('war_igl')
                .setDescription('Name of the War IGL')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('enemy_team')
                .setDescription('Enemy Team Name')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('allies')
                .setDescription('Allies Name (Optional)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const serverIp = interaction.options.getString('server_ip');
        const timing = interaction.options.getString('timing');
        const warIgl = interaction.options.getString('war_igl');
        const enemyTeam = interaction.options.getString('enemy_team');
        const allies = interaction.options.getString('allies') || 'None';

        const warTemplate = 
            `# ⚔️ **TEAM V8 — WAR ANNOUNCEMENT** ⚔️\n\n` +
            `🌐 **Server IP:** \`${serverIp}\`\n` +
            `⏰ **Timing:** \`${timing}\`\n` +
            `👑 **War IGL:** \`${warIgl}\`\n` +
            `🔊 **VC:** Team VC\n\n` +
            `🎯 **Enemy Team:** \`${enemyTeam}\`\n` +
            `🤝 **Allies:** \`${allies}\`\n\n` +
            `⚡ *Please join on time and follow IGL callouts!*`;

        await interaction.editReply(warTemplate);
    }
};
