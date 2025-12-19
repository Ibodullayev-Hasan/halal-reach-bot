import { Telegraf, Context, session } from "telegraf";
import { environments } from "@config/environments";
import { StartCommand } from "./commands/start.command";
import { TelegramError } from "telegraf";
import { logger } from "@utils/logger";
import { RegisterCommand } from "./commands/regsiter.command";
import { UserProfile } from "./commands/profile";
import { BotHelp } from "./commands/help";
import { isUser } from "middlewares/is.user.middleware";
import { isExisting } from "middlewares/is.existing.middleware";
import { IMyContext } from "./my-context";
import { myStage } from "./scenes";

export class BotService {
	private bot: Telegraf<IMyContext>;
	private startCommand: StartCommand;
	private registerCommand: RegisterCommand;

	constructor() {
		this.bot = new Telegraf<IMyContext>(environments.BOT_TOKEN!);
		this.startCommand = new StartCommand();
		this.registerCommand = new RegisterCommand();
	}

	public async init(): Promise<void> {
		try {

			this.bot.use(session())
			this.bot.use(myStage.middleware())

			// kommanda ni tinglash
			this.bot.command("start", isExisting, (ctx) => this.startCommand.startMessage(ctx));
			this.bot.command("profile", isUser, async (ctx) => UserProfile(ctx));
			this.bot.command("help", isUser, async (ctx) => BotHelp(ctx));
			this.bot.command("super_admin", isUser, async (ctx) => ctx.scene.enter(`superAdmin`));
			this.bot.command("admin", async (ctx) => ctx.scene.enter(`admin`))

			// inline keyboard ni tinglash
			this.bot.action("accept", async (ctx) => await this.registerCommand.userAccept(ctx));
			this.bot.action(`add_category`, async (ctx) => await ctx.scene.enter(`categoryScene`));
			this.bot.action(`return_to_add_product`, async (ctx) => await ctx.scene.enter(`productScene`));

			// bot on
			this.bot.on("contact", async (ctx) => { this.registerCommand.register(ctx) })

			this.bot.on("message", async (ctx: IMyContext) => {
				await ctx.reply(`Menu orqali kerakli kommandani bering\n/super_admin\n/admin\n/profile`, {
					reply_markup: { remove_keyboard: true }
				})
			})

			// bot err block
			this.bot.catch((err: unknown) => {
				console.error("❌ Botda xatolik:", err);
				if (err instanceof TelegramError) {
					console.error("Telegram API xatoligi:", err.description);
				}
			});

			// botni ishga tushirish
			await this.bot.launch(() => { logger.info("🤖 Bot muvaffaqiyatli ishga tushdi 🚀") });

		} catch (err) {
			console.error("❌ Botni ishga tushirishda xatolik:", err);
		}
	}
};
