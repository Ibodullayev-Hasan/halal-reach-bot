import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";
import { Order } from "db/entities/order.entity";
import { orderList } from "modules/orders";

/* ====================== Order SCENE ====================== */
export const orderScene = new Scenes.BaseScene<IMyContext>(`orderScene`);

orderScene.use(keepSceneAlive);

orderScene.enter(async (ctx) => {
	const orderMenuKeyboard = Markup.keyboard([
		[
			`📋  Buyurtmalar listi`
		],
		[`Back`]
	]).resize();

	await ctx.reply(`Buyurtmalar bo'limi`, orderMenuKeyboard);
});

orderScene.hears(`📋  Buyurtmalar listi`, async (ctx) => ctx.scene.enter(`orderListWizard`));
orderScene.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('admin')
});

// order list wizard
export const orderListWizard = new Scenes.WizardScene<IMyContext>(
	`orderListWizard`,

	// Step 1: list
	async (ctx: IMyContext) => {
		try {
			const orders: Order[] = await orderList();

			if (orders.length === 0) {
				await ctx.reply("Hozircha buyurtmalar mavjud emas!");
				return ctx.scene.leave();
			}

			const ordersText = orders
				.map((order) => {
					return (
						`📦 Buyurtma ID: ${order.id}\n` +
						`👤 Foydalanuvchi ID: ${order.userId}\n` +
						`🛒 Mahsulotlar soni: ${order.items.length}\n` +
						`💰 Umumiy summa: ${order.totalPrice} UZS\n` +
						`📅 Sana: ${order.createdAt.toLocaleString()}\n\n`
					);
				})
				.join('');

			await ctx.reply(`Buyurtmalar ro'yxati:\n\n${ordersText}`);
		} catch (error: any) {
			console.error("Order xatolik:", error);
			await ctx.reply(
				"Order xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring. /admin orqali bosh menyuga qayting."
			);
			return ctx.scene.leave();
		}
	}
);



