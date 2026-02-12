import { bot } from "./bot/index.ts";
import { logBotStart, logBotStop } from "./utils/logger.ts";

console.log("🤖 Starting Metrobot...");
logBotStart();

// Start the bot
bot.start({
	onStart: () => {
		console.log("✅ Bot is running!");
		console.log("Press Ctrl+C to stop.");
	},
});

// Graceful shutdown
const shutdown = async () => {
	console.log("\n🛑 Shutting down bot...");
	logBotStop();
	await bot.stop();
	console.log("✅ Bot stopped successfully");
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
