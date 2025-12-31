import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity("order_items")
export class OrderItem {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => Order, (order) => order.items)
	@JoinColumn({ name: "orderId" })
	order: Order;

	@Column()
	productId: string;

	@Column()
	quantity: number;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	priceAtPurchase: number;
}
