import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('points.json');

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return {};
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), 'utf8');
}

export default {
    data: new SlashCommandBuilder()
        .setName('point_add')
        .setDescription('Add points to a user (Max 10 per day)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(option => option.setName('points').setDescription('Points to add').setRequired(true)),

    async execute(interaction, config, client) {
        await interaction.deferReply();
        const user = interaction.options.getMember('user');
        const points = interaction.options.getInteger('points');

        if (points <= 0) {
            return interaction.editReply("❌ Points must be 1 or greater!");
        }

        let data = loadData();
        const userId = user.id;
        const todayStr = new Date().toISOString().split('T')[0];

        if (!data[userId]) {
            data[userId] = { total_points: 0, daily_points: 0, last_date: todayStr };
        }

        let userData = data[userId];

        if (userData.last_date !== todayStr) {
            userData.daily_points = 0;
            userData.last_date = todayStr;
        }

        if (userData.daily_points + points > 10) {
            const remaining = 10 - userData.daily_points;
            return interaction.editReply(
                `⚠️ **Daily Limit Exceeded!** This user can only receive up to **10 points** per day.\n` +
                `Given today: \`${userData.daily_points}/10\` | Remaining allowance: \`${Math.max(0, remaining)}\``
            );
        }

        userData.daily_points += points;
        userData.total_points += points;
        saveData(data);

        await interaction.editReply(
            `✅ **+${points} Points** added to ${user}!\n` +
            `📊 **Weekly Total:** \`${userData.total_points}\` points\n` +
            `📅 **Given Today:** \`${userData.daily_points}/10\``
        );
    }
};
