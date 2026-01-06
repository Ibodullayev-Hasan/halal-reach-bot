import { IMyContext } from "@bot/my-context";
import { Order } from "db/entities/order.entity"
import { OrderItem } from "db/entities/order.item.entity";
import { orderRepo } from "db/repositories"
import { OrderStatus } from "enums/order.status.enum";

export const orderList = async (): Promise<Order[]> => {

	return await orderRepo.find({ relations: { items: true } });
};

export const newOrder = async (ctx: IMyContext, data: Order): Promise<Order> => {
	try {
		const orderRepository = orderRepo

		// Yangi Order ob'ektini yaratish
		const newOrder = orderRepository.create({
			userId: data.userId,
			totalPrice: data.totalPrice, // Agar hisoblash kerak bo'lsa, quyida misol bor
			status: data.status || OrderStatus.PENDING
		});

		// OrderItem'larni yaratish va bog'lash
		newOrder.items = data.items.map((itemData) => {
			const orderItem = new OrderItem();
			orderItem.productId = itemData.productId;
			orderItem.quantity = itemData.quantity;
			orderItem.priceAtPurchase = itemData.priceAtPurchase;
			return orderItem;
		});

		newOrder.totalPrice = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.priceAtPurchase), 0);

		const savedOrder = await orderRepository.save(newOrder);

		return savedOrder;
	} catch (error) {
		console.error(error);
		await ctx.reply(`Nimadir xato ketdi, birozdan keyin qayta urinib ko'ring 🙏`);
		throw error; // yoki return null, xato holatiga qarab
	}
};

