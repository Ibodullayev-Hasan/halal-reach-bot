import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "./category.entity";

@Entity({ name: "product" })
export class Product {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "text", nullable: false })
	name: string;

	@Column({ type: "int" })
	price: number;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ type: "text", nullable: true })
	productImg?: string;

	@ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
	category: Category;

	@CreateDateColumn()
	createdAt?: Date

	@UpdateDateColumn()
	updatedAt?: Date

};