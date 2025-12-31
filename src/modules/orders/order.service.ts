import { Order } from "db/entities/order.entity"
import { orderRepo } from "db/repositories"

export const orderList = async (): Promise<Order[]> => {

	return await orderRepo.find({ relations: { items: true } });
}