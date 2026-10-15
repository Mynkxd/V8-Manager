import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send custom DM to [+] TeamV8 members')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('message').setDescription('Message to send').setRequired(true)),

    async execute(interaction, config, client) {
        await interaction.deferReply({ flags: 64 }); // Ephemeral flag
        const messageText = interaction.options.getString('message');
        
        const role = interaction.guild.roles.cache.find(r => r.name === '[+] TeamV8');
        if (!role) {
            return interaction.editReply("❌ Error: Server par '[+] TeamV8' role nahi mila!");
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const member of role.members.values()) {
            if (!member.user.bot) {
                try {
                    await member.send(messageText);
                    sentCount++;
                } catch {
                    failedCount++;
                }
            }
        }

        await interaction.editReply(`✅ **DMs Processed!**\n📩 Delivered: ${sentCount}\n❌ Failed: ${failedCount}`);
    }
};
