import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('war')
        .setDescription('Generate War Template in current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('server_ip').setDescription('Server IP').setRequired(true))
        .addStringOption(option => option.setName('timing').setDescription('War Timing').setRequired(true))
        .addStringOption(option => option.setName('war_igl').setDescription('War IGL Name').setRequired(true))
        .addStringOption(option => option.setName('enemy_team').setDescription('Enemy Team Name').setRequired(true))
        .addStringOption(option => option.setName('allies').setDescription('Allies Name').setRequired(false)),

    async execute(interaction, config, client) {
        await interaction.deferReply();
        const server_ip = interaction.options.getString('server_ip');
        const timing = interaction.options.getString('timing');
        const war_igl = interaction.options.getString('war_igl');
        const enemy_team = interaction.options.getString('enemy_team');
        const allies = interaction.options.getString('allies') || 'None';

        const warTemplate = (
            `# ⚔️ **TEAM V8 — WAR ANNOUNCEMENT** ⚔️\n\n` +
            `🌐 **Server IP:** \`${server_ip}\`\n` +
            `⏰ **Timing:** \`${timing}\`\n` +
            `👑 **War IGL:** \`${war_igl}\`\n` +
            `🔊 **VC:** Team VC\n\n` +
            `🎯 **Enemy Team:** \`${enemy_team}\`\n` +
            `🤝 **Allies:** \`${allies}\`\n\n` +
            `⚡ *Please join on time and follow IGL callouts!*`
        );

        await interaction.editReply(warTemplate);
    }
};
