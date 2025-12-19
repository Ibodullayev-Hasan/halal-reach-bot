import { UserRoles } from "enums/roles.enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "users" })
export class User {

	@PrimaryGeneratedColumn("uuid")
	id: string

	@Column({ type: "bigint", nullable: false })
	telegramId: number

	@Column()
	firstName: string

	@Column({type:"text", nullable:true})
	lastName: string

	@Column()
	userName: string

	@Column({ type: "text", nullable: true })
	avatarUri?: string

	@Column({ type: "enum", enum: UserRoles, default: UserRoles.SUPER_ADMIN })
	userRole: UserRoles

	@Column({ type: "varchar", length: 20 })
	phoneNumber: string;

	@CreateDateColumn()
	createdAt?: Date

	@UpdateDateColumn()
	updatedAt?: Date

};