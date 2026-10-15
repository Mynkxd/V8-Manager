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
        .setDescription("R.O.T.I Style Advanced Category-Role Ticket System.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("setup")
                .setDescription("Setup ticket panel with dedicated staff roles per category.")
                .addChannelOption((option) =>
                    option.setName("panel_channel")
                        .setDescription("Channel where the ticket panel will be posted")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("panel_title")
                        .setDescription("Title for the ticket embed panel")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("panel_message")
                        .setDescription("Main description message for the embed")
                        .setRequired(true)
                )

                // Category Option 1 & Dedicated Role 1
                .addStringOption((option) =>
                    option.setName("opt1_label").setDescription("Category 1 Title (e.g. TvT Support)").setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("opt1_desc").setDescription("Category 1 Description").setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName("opt1_role").setDescription("Staff Role for Category 1 (e.g. TvT Manager)").setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("opt1_emoji").setDescription("Category 1 Emoji (e.g. ⚔️)").setRequired(false)
                )

                // Category Option 2 & Dedicated Role 2
                .addStringOption((option) =>
                    option.setName("opt2_label").setDescription("Category 2 Title (e.g. General Support)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt2_desc").setDescription("Category 2 Description").setRequired(false)
                )
                .addRoleOption((option) =>
                    option.setName("opt2_role").setDescription("Staff Role for Category 2 (e.g. Ticket Staff)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt2_emoji").setDescription("Category 2 Emoji (e.g. ❓)").setRequired(false)
                )

                // Category Option 3 & Dedicated Role 3
                .addStringOption((option) =>
                    option.setName("opt3_label").setDescription("Category 3 Title (e.g. Clan Recruitment)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt3_desc").setDescription("Category 3 Description").setRequired(false)
                )
                .addRoleOption((option) =>
                    option.setName("opt3_role").setDescription("Staff Role for Category 3 (e.g. Clan Leader)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt3_emoji").setDescription("Category 3 Emoji (e.g. 👑)").setRequired(false)
                )

                // Category Option 4 & Dedicated Role 4
                .addStringOption((option) =>
                    option.setName("opt4_label").setDescription("Category 4 Title (Optional)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt4_desc").setDescription("Category 4 Description (Optional)").setRequired(false)
                )
                .addRoleOption((option) =>
                    option.setName("opt4_role").setDescription("Staff Role for Category 4 (Optional)").setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("opt4_emoji").setDescription("Category 4 Emoji (Optional)").setRequired(false)
                )

                // General Ticket Category Container
                .addChannelOption((option) =>
                    option.setName("ticket_category")
                        .setDescription("Discord Category where new ticket channels will open")
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("dashboard").setDescription("Open interactive ticket dashboard")
        ),
    category: "ticket",

    async execute(interaction, config, client) {
        // --- 1. HANDLE DROPDOWN SELECTION (WHEN USER CREATES TICKET) ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_path') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const selectedValue = interaction.values[0]; // Format: "cat_1_ROLEID"
            const valueParts = selectedValue.split('_');
            const roleId = valueParts[2]; // Extracted Dedicated Staff Role ID

            const guild = interaction.guild;
            const user = interaction.user;
            const guildConfig = (await getGuildConfig(client, guild.id)) || {};

            // Prevent duplicate ticket spam
            const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
            if (existingChannel) {
                return await interaction.editReply({ content: `❌ You already have an open ticket: ${existingChannel}` });
            }

            // Define strict category-role permissions
            const permissionOverwrites = [
                {
                    id: guild.id, // @everyone -> Lock channel
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id, // Ticket Owner -> Full Access
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                }
            ];

            // Grant permission ONLY to the specific staff role configured for this category
            if (roleId && roleId !== 'norole') {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
                });
            }

            try {
                // Create private channel
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username.toLowerCase()}`,
                    type: ChannelType.GuildText,
                    parent: guildConfig?.ticketCategoryId || null,
                    permissionOverwrites: permissionOverwrites
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🎫 Ticket Created — ${user.username}`)
                    .setDescription(`Welcome ${user}!\nStaff with designated category permissions will assist you shortly.`)
                    .setColor('#5865F2')
                    .setTimestamp();

                const rolePing = (roleId && roleId !== 'norole') ? `<@&${roleId}>` : '';
                await ticketChannel.send({ content: `${user} ${rolePing}`, embeds: [welcomeEmbed] });

                return await interaction.editReply({ content: `✅ Ticket channel created successfully: ${ticketChannel}` });
            } catch (err) {
                return await interaction.editReply({ content: `❌ Failed to create ticket channel. Please check bot permissions.` });
            }
        }

        // --- 2. HANDLE SLASH COMMAND EXECUTION (/ticket setup) ---
        const deferred = await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
        if (!deferred) return;

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return await replyUserError(interaction, { type: ErrorTypes.PERMISSION, message: 'You need `Manage Channels` permission.' });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "dashboard") {
            return ticketConfig.execute(interaction, config, client);
        }

        if (subcommand === "setup") {
            const panelChannel = interaction.options.getChannel("panel_channel");
            const panelTitle = interaction.options.getString("panel_title");
            const panelMessage = interaction.options.getString("panel_message");
            const ticketCategory = interaction.options.getChannel("ticket_category");

            const menuOptions = [];

            // Dynamically collect up to 4 custom options with their specific role mappings
            for (let i = 1; i <= 4; i++) {
                const label = interaction.options.getString(`opt${i}_label`);
                const desc = interaction.options.getString(`opt${i}_desc`);
                const role = interaction.options.getRole(`opt${i}_role`);
                const emoji = interaction.options.getString(`opt${i}_emoji`);

                if (label && desc) {
                    const roleIdTag = role ? role.id : 'norole';
                    const optionObject = {
                        label: label,
                        description: desc,
                        value: `cat_${i}_${roleIdTag}` // Embeds specific role directly into dropdown value
                    };

                    if (emoji) {
                        optionObject.emoji = emoji.trim();
                    }

                    menuOptions.push(optionObject);
                }
            }

            if (menuOptions.length === 0) {
                return await replyUserError(interaction, { 
                    type: ErrorTypes.UNKNOWN, 
                    message: 'Please fill at least 1 Category Option with Label, Description, and Staff Role!' 
                });
            }

            // Create Panel Embed
            const setupEmbed = createEmbed({ 
                title: panelTitle, 
                description: panelMessage,
                color: getColor('info')
            });

            // Build Dropdown Select Menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("ticket_select_path")
                .setPlaceholder("👉 Select a ticket category...")
                .addOptions(menuOptions);

            const ticketRow = new ActionRowBuilder().addComponents(selectMenu);

            try {
                const sentPanel = await panelChannel.send({
                    embeds: [setupEmbed],
                    components: [ticketRow],
                });

                if (client.db && interaction.guildId) {
                    const currentConfig = (await getGuildConfig(client, interaction.guildId)) || {};
                    currentConfig.ticketCategoryId = ticketCategory ? ticketCategory.id : null;
                    currentConfig.ticketPanelChannelId = panelChannel.id;
                    currentConfig.ticketPanelMessageId = sentPanel?.id || null;

                    await setGuildConfig(client, interaction.guildId, currentConfig);
                }

                await InteractionHelper.safeEditReply(interaction, {
                    embeds: [successEmbed("Ticket System Deployed", `✅ R.O.T.I style ticket panel successfully sent to ${panelChannel}!\n\nEach dropdown option is linked to its own dedicated staff role.`)]
                });

            } catch (error) {
                await handleInteractionError(interaction, error, { commandName: 'ticket_setup', source: 'ticket_setup_command' });
            }
        }
    }
};
