import { OrderStatus } from "enums/order.status.enum";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order.item.entity";


@Entity("orders")
export class Order {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	userId: string;

	@OneToMany(() => OrderItem, (item) => item.order, {
		cascade: true,
	})
	items: OrderItem[];

	@Column({ type: "decimal", precision: 10, scale: 2 })
	totalPrice: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@Column({
		type: "enum",
		enum: OrderStatus,
		default: OrderStatus.PENDING,
	})
	status: OrderStatus;
}
