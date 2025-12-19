import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity({ name: "category" })
export class Category {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "text", nullable: false })
	name: string;

	@Column({ type: "text", nullable: true })
	categoryImg?: string;

	@OneToMany(() => Product, (product) => product.category)
	products: Product[];

	@CreateDateColumn()
	createdAt?: Date

	@UpdateDateColumn()
	updatedAt?: Date

}