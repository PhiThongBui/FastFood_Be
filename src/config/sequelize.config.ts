import { Address, CartItems, CartItemsIngredient, Carts, Category, Coupons, Ingredient, Order, OrderItemIngredient, OrderItems, Product, ProductIngredient, ProductVariant, Reviews, User, UserCoupons } from "@/models";
import { ConfigService } from "@nestjs/config";

export const sequelizeConfig = (config: ConfigService) => ({
    dialect: config.get('DB_DIALECT'),
    host: config.get('DB_HOST'),
    port: config.get<number>('DB_PORT') || 5432,
    username: config.get('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get('DB_NAME'),
    autoLoadModels: true,
    models: [User, Product, Category, ProductVariant, ProductIngredient, Ingredient, CartItems, Carts, Order, OrderItems, OrderItemIngredient, CartItemsIngredient, Reviews, UserCoupons, Coupons, Address],
})