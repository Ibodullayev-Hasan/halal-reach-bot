import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { AppDataSource } from "./data-source";
import { Category } from "./entities/category.entity";
import { Product } from "./entities/product.entity";
import { Order } from "./entities/order.entity";

export const userRepo: Repository<User> = AppDataSource.getRepository(User);
export const categoryRepo: Repository<Category> = AppDataSource.getRepository(Category);
export const productRepo: Repository<Product> = AppDataSource.getRepository(Product);
export const orderRepo: Repository<Order> = AppDataSource.getRepository(Order);