import { getColor } from '../../config/bot.js';
import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    EmbedBuilder,
    MessageFlags 
} from 'discord.js';
import { createEmbed, successEmbed } from '../../utils/embeds.js';
import { getGuildConfig, setGuildConfig } from '../../services/config/guildConfig.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError, replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import ticketConfig from './modules/ticket_dashboard.js';

export default {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Complete R.O.T.I style multi-category ticket management system.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        
        // 1. SUBCOMMAND: SETUP
        .addSubcommand((subcommand) =>
            subcommand
                .setName("setup")
                .setDescription("Deploy new ticket panel with category-specific roles.")
                .addChannelOption((option) =>
                    option.setName("panel_channel")
                        .setDescription("Channel where the panel will be posted")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("panel_title")
                        .setDescription("Title for the ticket panel embed")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("panel_message")
                        .setDescription("Main description for the panel embed")
                        .setRequired(true)
                )
                // Category 1
                .addStringOption((option) =>
                    option.setName("opt1_label").setDescription("Category 1 Title (e.g. General Support)").setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("opt1_desc").setDescription("Category 1 Description").setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName("opt1_role").setDescription("Staff Role for Category 1").setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("opt1_emoji").setDescription("Category 1 Emoji").setRequired(false)
                )
                // Category 2
                .addStringOption((option) =>
                    option.setName("opt2_label").setDescription("Category 2 Title (e.g. TvT Support)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt2_desc").setDescription("Category 2 Description").setRequired(false)
                )
                .addRoleOption((option) =>
                    option.setName("opt2_role").setDescription("Staff Role for Category 2").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt2_emoji").setDescription("Category 2 Emoji").setRequired(false)
                )
                // Category 3
                .addStringOption((option) =>
                    option.setName("opt3_label").setDescription("Category 3 Title").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt3_desc").setDescription("Category 3 Description").setRequired(false)
                )
                .addRoleOption((option) =>
                    option.setName("opt3_role").setDescription("Staff Role for Category 3").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt3_emoji").setDescription("Category 3 Emoji").setRequired(false)
                )
                .addChannelOption((option) =>
                    option.setName("ticket_category")
                        .setDescription("Container channel category for active tickets")
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
        )
        
        // 2. SUBCOMMAND: CONFIG
        .addSubcommand((subcommand) =>
            subcommand
                .setName("config")
                .setDescription("View active ticket system setup and role mappings.")
        )
        
        // 3. SUBCOMMAND: EDIT
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Update existing panel title and message text.")
                .addStringOption((option) =>
                    option.setName("panel_title")
                        .setDescription("New panel embed title")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("panel_message")
                        .setDescription("New panel embed description")
                        .setRequired(true)
                )
        )

        // 4. SUBCOMMAND: DASHBOARD
        .addSubcommand((subcommand) =>
            subcommand.setName("dashboard").setDescription("Open interactive management dashboard")
        ),

    category: "ticket",

    async execute(interaction, config, client) {
        // --- A. DROPDOWN SELECTION INTERACTION HANDLER ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_path') {
            try {
                // Instant defer to defeat Discord 3-second timeout
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                }

                const selectedValue = interaction.values[0]; 
                const valueParts = selectedValue.split('_');
                const roleId = valueParts[2]; 

                const guild = interaction.guild;
                const user = interaction.user;
                const guildConfig = (await getGuildConfig(client, guild.id)) || {};

                // Check for duplicate active ticket
                const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
                if (existingChannel) {
                    return await interaction.editReply({ content: `❌ You already have an active ticket open: ${existingChannel}` });
                }

                const permissionOverwrites = [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.SendMessages, 
                            PermissionFlagsBits.ReadMessageHistory, 
                            PermissionFlagsBits.AttachFiles
                        ],
                    }
                ];

                if (roleId && roleId !== 'norole') {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.SendMessages, 
                            PermissionFlagsBits.ReadMessageHistory, 
                            PermissionFlagsBits.ManageMessages
                        ],
                    });
                }

                // Create Ticket Text Channel
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username.toLowerCase()}`,
                    type: ChannelType.GuildText,
                    parent: guildConfig?.ticketCategoryId || null,
                    permissionOverwrites: permissionOverwrites
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🎫 Ticket Created — ${
