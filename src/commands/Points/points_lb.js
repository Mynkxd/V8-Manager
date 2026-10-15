import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('points.json');

export default {
    data: new SlashCommandBuilder()
        .setName('points_lb')
        .setDescription('View weekly points leaderboard'),

    async execute(interaction, config, client) {
        await interaction.deferReply();

        if (!fs.existsSync(DATA_FILE)) {
            return interaction.editReply("📊 Abhi tak kisi member ke points add nahi hue hain.");
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (Object.keys(data).length === 0) {
            return interaction.editReply("📊 Abhi tak kisi member ke points add nahi hue hain.");
        }

        const sortedUsers = Object.entries(data).sort((a, b) => b[1].total_points - a[1].total_points);

        let lbText = "🏆 **TEAM V8 — WEEKLY POINTS LEADERBOARD** 🏆\n\n";
        let rank = 1;

        for (const [uId, uInfo] of sortedUsers) {
            const pts = uInfo.total_points || 0;
            const member = await interaction.guild.members.fetch(uId).catch(() => null);
            const name = member ? member.displayName : `User (${uId})`;
            
            const promoStatus = pts >= 50 ? " 🎖️ **[ELIGIBLE FOR PROMO]**" : "";
            
            lbText += `\`#${rank}\` **${name}** — \`${pts} Points\`${promoStatus}\n`;
            rank++;
        }

        lbText += "\n🔄 *Leaderboard tracks weekly points!*";
        await interaction.editReply(lbText);
    }
};
