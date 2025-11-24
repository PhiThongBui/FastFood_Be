import { BadRequestException, Injectable } from '@nestjs/common';
import {
    categories,
    ingredients,
    productIngredients,
    products,
    productVariants,
    users,
    addresses,
    combos,
    comboItems,
    coupons,
    userCoupons,
    carts,
    cartItems,
    cartItemsIngredients,
    orders,
    orderItems,
    orderItemIngredients,
    reviews,
} from './data/data';
import { InjectModel } from '@nestjs/sequelize';
import {
    Address,
    Category,
    Ingredient,
    Product,
    ProductIngredient,
    ProductVariant,
    User,
    Combo,
    ComboItem,
    Coupons,
    UserCoupons,
    Carts,
    CartItems,
    CartItemsIngredient,
    Order,
    OrderItems,
    OrderItemIngredient,
    Reviews
} from '@/models';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeederService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(Address) private readonly addressModel: typeof Address,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductVariant) private readonly productVariantModel: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly productIngredientModel: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
        @InjectModel(Combo) private readonly comboModel: typeof Combo,
        @InjectModel(ComboItem) private readonly comboItemModel: typeof ComboItem,
        @InjectModel(Coupons) private readonly couponsModel: typeof Coupons,
        @InjectModel(UserCoupons) private readonly userCouponsModel: typeof UserCoupons,
        @InjectModel(Carts) private readonly cartsModel: typeof Carts,
        @InjectModel(CartItems) private readonly cartItemsModel: typeof CartItems,
        @InjectModel(CartItemsIngredient) private readonly cartItemsIngredientModel: typeof CartItemsIngredient,
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderItems) private readonly orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItemIngredient) private readonly orderItemIngredientModel: typeof OrderItemIngredient,
        @InjectModel(Reviews) private readonly reviewsModel: typeof Reviews,
        private readonly sequelize: Sequelize
    ) { }

    // ✅ FIX: Xử lý null password cho Google user
    private async seedUser(transaction: Transaction) {
        const userFormat = users.map((item) => {
            // Chỉ hash password nếu có (local users)
            if (item?.password) {
                const hashedPassword = bcrypt.hashSync(item.password, 10);
                return { ...item, password: hashedPassword };
            }
            // Google users không có password
            return { ...item, password: null };
        });

        const result = await this.userModel.bulkCreate(userFormat as any, { 
            transaction,
            validate: true 
        });
        
        console.log(`✅ Seeded ${result.length} users`);
        return result;
    }

    private async seedAddresses(transaction: Transaction) {
        // ✅ Verify users exist trước
        const userCount = await this.userModel.count({ transaction });
        if (userCount === 0) {
            throw new Error('Cannot seed addresses: No users found in database');
        }
        
        const result = await this.addressModel.bulkCreate(addresses as any, { 
            transaction,
            validate: true 
        });
        
        console.log(`✅ Seeded ${result.length} addresses`);
        return result;
    }

    private async seedCategories(transaction: Transaction) {
        const result = await this.categoryModel.bulkCreate(categories as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} categories`);
        return result;
    }

    private async seedProducts(transaction: Transaction) {
        const result = await this.productModel.bulkCreate(products as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} products`);
        return result;
    }

    private async seedIngredients(transaction: Transaction) {
        const result = await this.ingredientModel.bulkCreate(ingredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} ingredients`);
        return result;
    }

    private async seedProductVariants(transaction: Transaction) {
        const result = await this.productVariantModel.bulkCreate(productVariants as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} product variants`);
        return result;
    }

    private async seedProductIngredients(transaction: Transaction) {
        const result = await this.productIngredientModel.bulkCreate(productIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} product ingredients`);
        return result;
    }

    private async seedCombos(transaction: Transaction) {
        const result = await this.comboModel.bulkCreate(combos as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} combos`);
        return result;
    }

    private async seedComboItems(transaction: Transaction) {
        const result = await this.comboItemModel.bulkCreate(comboItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} combo items`);
        return result;
    }

    private async seedCoupons(transaction: Transaction) {
        const result = await this.couponsModel.bulkCreate(coupons as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} coupons`);
        return result;
    }

    private async seedUserCoupons(transaction: Transaction) {
        const result = await this.userCouponsModel.bulkCreate(userCoupons as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} user coupons`);
        return result;
    }

    private async seedCarts(transaction: Transaction) {
        const result = await this.cartsModel.bulkCreate(carts as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} carts`);
        return result;
    }

    private async seedCartItems(transaction: Transaction) {
        const result = await this.cartItemsModel.bulkCreate(cartItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} cart items`);
        return result;
    }

    private async seedCartItemsIngredients(transaction: Transaction) {
        const result = await this.cartItemsIngredientModel.bulkCreate(cartItemsIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} cart items ingredients`);
        return result;
    }

    private async seedOrders(transaction: Transaction) {
        const result = await this.orderModel.bulkCreate(orders as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} orders`);
        return result;
    }

    private async seedOrderItems(transaction: Transaction) {
        const result = await this.orderItemsModel.bulkCreate(orderItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} order items`);
        return result;
    }

    private async seedOrderItemIngredients(transaction: Transaction) {
        const result = await this.orderItemIngredientModel.bulkCreate(orderItemIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} order item ingredients`);
        return result;
    }

    private async seedReviews(transaction: Transaction) {
        const result = await this.reviewsModel.bulkCreate(reviews as any, { 
            transaction,
            validate: true 
        });
        console.log(`✅ Seeded ${result.length} reviews`);
        return result;
    }

    async runAllSeeder() {
        const transaction = await this.sequelize.transaction();

        try {
            console.log('🌱 Starting seeder...\n');

            // 1. Base data (không có dependency)
            console.log('📝 Seeding users...');
            await this.seedUser(transaction);

            console.log('📝 Seeding categories...');
            await this.seedCategories(transaction);

            // 2. User-related data
            console.log('📝 Seeding addresses...');
            await this.seedAddresses(transaction);

            // 3. Product data
            console.log('📝 Seeding products...');
            await this.seedProducts(transaction);

            console.log('📝 Seeding ingredients...');
            await this.seedIngredients(transaction);

            console.log('📝 Seeding product variants...');
            await this.seedProductVariants(transaction);

            console.log('📝 Seeding product ingredients...');
            await this.seedProductIngredients(transaction);

            // 4. Combo data
            console.log('📝 Seeding combos...');
            await this.seedCombos(transaction);

            console.log('📝 Seeding combo items...');
            await this.seedComboItems(transaction);

            // 5. Coupon data
            console.log('📝 Seeding coupons...');
            await this.seedCoupons(transaction);

            console.log('📝 Seeding user coupons...');
            await this.seedUserCoupons(transaction);

            // 6. Cart data
            console.log('📝 Seeding carts...');
            await this.seedCarts(transaction);

            console.log('📝 Seeding cart items...');
            await this.seedCartItems(transaction);

            console.log('📝 Seeding cart items ingredients...');
            await this.seedCartItemsIngredients(transaction);

            // 7. Order data
            console.log('📝 Seeding orders...');
            await this.seedOrders(transaction);

            console.log('📝 Seeding order items...');
            await this.seedOrderItems(transaction);

            console.log('📝 Seeding order item ingredients...');
            await this.seedOrderItemIngredients(transaction);

            // 8. Review data (cuối cùng)
            console.log('📝 Seeding reviews...');
            await this.seedReviews(transaction);

            await transaction.commit();
            
            console.log('\n✅ Seeder completed successfully!');
            console.log('='.repeat(50));

            return {
                message: "Seeder successfully!",
                summary: {
                    users: users.length,
                    addresses: addresses.length,
                    categories: categories.length,
                    products: products.length,
                    ingredients: ingredients.length,
                    productVariants: productVariants.length,
                    productIngredients: productIngredients.length,
                    combos: combos.length,
                    comboItems: comboItems.length,
                    coupons: coupons.length,
                    userCoupons: userCoupons.length,
                    carts: carts.length,
                    cartItems: cartItems.length,
                    cartItemsIngredients: cartItemsIngredients.length,
                    orders: orders.length,
                    orderItems: orderItems.length,
                    orderItemIngredients: orderItemIngredients.length,
                    reviews: reviews.length
                }
            };
        } catch (error) {
            await transaction.rollback();
            console.error('\n❌ Seeding failed:', error.message);
            console.error('Error details:', error);
            throw new BadRequestException(`Seed Failed: ${error.message}`);
        }
    }

    // Method để clear tất cả data (useful cho testing)
    // Sửa lại đoạn code clearAllData trong file seeder.service.ts

    async clearAllData() {
        const transaction = await this.sequelize.transaction();

        try {
            console.log('🗑️  Clearing all data...\n');

            // Sử dụng option: { truncate: true, cascade: true, restartIdentity: true }
            // restartIdentity: true -> Reset ID về 1 (Chỉ work tốt trên Postgres)
            // cascade: true -> Xóa luôn dữ liệu bảng con liên quan (đỡ phải xóa ngược từng bảng)
            
            // Xóa theo thứ tự để an toàn, nhưng quan trọng nhất là các bảng cha (Users, Categories...) cần restartIdentity
            
            // Xóa các bảng phụ trước (hoặc dùng cascade ở bảng cha cũng được, nhưng viết rõ cho an toàn)
            await this.reviewsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.orderItemIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.orderItemsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.orderModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            
            await this.cartItemsIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.cartItemsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.cartsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            
            await this.userCouponsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.couponsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            
            await this.comboItemModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.comboModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            
            await this.productIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.productVariantModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.ingredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            
            // QUAN TRỌNG: Các bảng này được tham chiếu bởi bảng khác, cần reset ID về 1
            await this.productModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.addressModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.categoryModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });
            await this.userModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true });

            await transaction.commit();
            console.log('✅ All data cleared and IDs reset!\n');

            return { message: "All data cleared successfully!" };
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Clear data failed:', error);
            throw new BadRequestException(`Clear data failed: ${error.message}`);
        }
    }
}
