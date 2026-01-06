import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";
import { Order } from "db/entities/order.entity";
import { newOrder, orderList } from "modules/orders";
import { buildProductMessage } from "../product/utils";
import { categoryList, findByIdCategory } from "modules/categories/category.service";
import { findByIdProdcut } from "modules/products";
import { OrderItem } from "db/entities/order.item.entity";
import { OrderStatus } from "enums/order.status.enum";


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
			return ctx.scene.enter(`client`)
		} catch (error: any) {
			console.error("Order xatolik:", error);
			await ctx.reply(
				"Order xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring. /admin orqali bosh menyuga qayting."
			);
			return ctx.scene.leave();
		}
	}
);


// new order wizard
export const newOrderWizard = new Scenes.WizardScene<IMyContext>(
	`newOrderWizard`,

	// Step 1: start order
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);
		const chatId = ctx.chat!.id;

		if (categories.length === 0) {

			const returnMenu = Markup.inlineKeyboard([[Markup.button.callback(`Menyuga qaytish ↩️`, `return_client_menu`)]])

			await ctx.telegram.sendMessage(chatId, `Afsus mijoz hozircha bizda mahsulotlar yoq 😔 `, Markup.removeKeyboard())
			await ctx.telegram.sendMessage(chatId, `Menyuga qaytish uchun pastdagi tugmani bosing`, returnMenu)
		};

		const categoryButtons = categories.map((cat) => Markup.button.callback(cat.name, `cat_${cat.id}`));

		await ctx.reply(`Buyurtma berish uchun categoryni tanlang`, Markup.inlineKeyboard(categoryButtons, { columns: 2 }));
		return ctx.wizard.next();
	},

	// Step 2: find product
	async (ctx: IMyContext) => {
		try {

			if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
				await ctx.reply("Iltimos, kategoriyani tanlang.");
				return;
			};

			const categoryId = ctx.callbackQuery.data.split("_")[1];

			const chatId = ctx.from?.id;

			await ctx.answerCbQuery();

			const category = await findByIdCategory(ctx, categoryId);

			if (!category || !category.products.length) {
				await ctx.telegram.sendMessage(
					chatId,
					"Ushbu kategoriyada mahsulot yo‘q."
				);

				return;
			};

			for (const product of category.products) {
				const messageText = buildProductMessage(product, category)

				if (product.productImg) {
					await ctx.telegram.sendPhoto(
						chatId,
						product.productImg,
						{
							caption: messageText,
							parse_mode: "MarkdownV2",
							reply_markup: { inline_keyboard: [[Markup.button.callback(`+ 1`, `product_${product.id}`)]] }
						}
					);
				} else {
					await ctx.telegram.sendMessage(
						chatId,
						messageText,
						{
							parse_mode: "MarkdownV2",
							reply_markup: { inline_keyboard: [[Markup.button.callback(`+ 1`, `product_${product.id}`)]] }

						}
					);
				};
			};

			return ctx.wizard.next();
		} catch (error) {
			console.error(error);
			await ctx.reply(`Nimadir xato ketdi, qayta urinib koring!`);
			return ctx.scene.leave();
		}
	},

	// Step 3: add product to cart (+1 bosilganda)
	async (ctx: IMyContext) => {
		try {
			if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
				await ctx.reply("Iltimos, mahsulotni tanlang.");
				return;
			};

			await ctx.answerCbQuery();

			const productId = ctx.callbackQuery.data.split("_")[1];

			if (!ctx.session.orders) {
				ctx.session.orders = []; // Massivni initsializatsiya
			}

			ctx.session.orders.push(productId);

			// Tez tasdiq xabari
			await ctx.answerCbQuery(`Mahsulot `,
				{ show_alert: true }
			);

			// Tugmalar: yana qo'shish, savatni ko'rsatish, tasdiqlash
			const keyboard = Markup.inlineKeyboard([
				[Markup.button.callback("Yana mahsulot qo'shish", "add_more")],
				[Markup.button.callback("Savatni ko'rish", "view_cart")],
				[Markup.button.callback("Buyurtmani tasdiqlash", "confirm_order")],
				[Markup.button.callback("Bekor qilish", "cancel_order")],
			]);

			await ctx.reply("Anqara Turkey", keyboard);

			return ctx.wizard.next();
		} catch (error) {
			console.error(error);
			await ctx.reply(`Nimadir xato ketdi!`);
			return ctx.scene.leave();
		}
	},

	// Step 4: Handle actions (add more, view cart, confirm, cancel)
	async (ctx: IMyContext) => {
		try {
			if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
				await ctx.reply("Iltimos, tanlov qiling.");
				return;
			};

			await ctx.answerCbQuery();

			const action = ctx.callbackQuery.data;

			if (action === "add_more") {
				// Kategoriyalarga qaytish (Step 1)
				return ctx.wizard.selectStep(0);
			} else if (action === "cancel_order") {
				ctx.session.orders = [];
				await ctx.reply("Buyurtma bekor qilindi.");
				return ctx.scene.leave();
			} else if (action === "view_cart") {
				// Savatni ko'rsatish (quantity ni sanash orqali)
				if (!ctx.session.orders || ctx.session.orders.length === 0) {
					await ctx.reply("Savat bo'sh.");
					return;
				}

				const cartMap = new Map<string, number>();
				for (const id of ctx.session.orders) {
					cartMap.set(id, (cartMap.get(id) || 0) + 1);
				}

				let cartMessage = "Sizning savatingiz:\n";
				let totalPrice = 0;

				for (const [productId, quantity] of cartMap) {
					const product = await findByIdProdcut(ctx, productId); // DB dan product olish (sizda shunday funksiya bo'lsin)
					if (product) {
						const itemPrice = product.price * quantity;
						totalPrice += itemPrice;
						cartMessage += `- ${product.name}: ${quantity} dona, narxi: ${itemPrice} so'm\n`;
					}
				}

				cartMessage += `\nUmumiy narx: ${totalPrice} so'm`;
				await ctx.reply(cartMessage);

				// Tugmalarni qayta jo'natish
				const keyboard = Markup.inlineKeyboard([
					[Markup.button.callback("Yana qo'shish", "add_more")],
					[Markup.button.callback("Tasdiqlash", "confirm_order")],
					[Markup.button.callback("Bekor", "cancel_order")],
				]);
				await ctx.reply("Keyingi?", keyboard);

				return; // Shu stepda qolish
			} else if (action === "confirm_order") {
				if (!ctx.session.orders || ctx.session.orders.length === 0) {
					await ctx.reply("Savat bo'sh. Buyurtma berolmaysiz.");
					return ctx.scene.leave();
				}

				// Quantity ni sanash va OrderItem yarating
				const cartMap = new Map<string, number>();
				for (const id of ctx.session.orders) {
					cartMap.set(id, (cartMap.get(id) || 0) + 1);
				}

				const orderItems: OrderItem[] = [];
				let totalPrice = 0;

				for (const [productId, quantity] of cartMap) {
					const product = await findByIdProdcut(ctx, productId);
					if (product) {
						const item = new OrderItem();
						item.productId = productId;
						item.quantity = quantity;
						item.priceAtPurchase = product.price;
						orderItems.push(item);

						totalPrice += product.price * quantity;
					}
				}

				// Yangi Order yaratish
				const order = new Order();
				order.userId = ctx.from!.id.toString();
				order.items = orderItems;
				order.totalPrice = totalPrice;
				order.status = OrderStatus.PENDING;

				// DB ga saqlash
				const savedOrder = await newOrder(ctx, order);

				await ctx.reply(`Buyurtma yaratildi! ID: ${savedOrder.id}. Umumiy narx: ${totalPrice} so'm. Tez orada bog'lanamiz.`);

				ctx.session.orders = []; // Tozalash
				return ctx.scene.enter(`client`);
			}
		} catch (error) {
			console.error(error);
			await ctx.reply(`Xato sodir bo'ldi!`);
			return ctx.scene.leave();
		}
	}
);



