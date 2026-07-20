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
    CartItemComboOption,
    CartItemComboOptionIngredient,
    CartItems,
    CartItemsIngredient,
    Order,
    OrderItemComboOption,
    OrderItems,
    OrderItemIngredient,
    Reviews
} from '@/models';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';
import { ORDERSTATUS, PAYMENTMETHOD, PAYMENTSTATUS } from '@/models/order.model';

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
        @InjectModel(CartItemComboOption) private readonly cartItemComboOptionModel: typeof CartItemComboOption,
        @InjectModel(CartItemComboOptionIngredient) private readonly cartItemComboOptionIngredientModel: typeof CartItemComboOptionIngredient,
        @InjectModel(CartItems) private readonly cartItemsModel: typeof CartItems,
        @InjectModel(CartItemsIngredient) private readonly cartItemsIngredientModel: typeof CartItemsIngredient,
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderItems) private readonly orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItemComboOption) private readonly orderItemComboOptionModel: typeof OrderItemComboOption,
        @InjectModel(OrderItemIngredient) private readonly orderItemIngredientModel: typeof OrderItemIngredient,
        @InjectModel(Reviews) private readonly reviewsModel: typeof Reviews,
        private readonly sequelize: Sequelize
    ) { }

    // âœ… FIX: Xá»­ lÃ½ null password cho Google user
    private async seedUser(transaction: Transaction) {
        const userFormat = users.map((item) => {
            // Chá»‰ hash password náº¿u cÃ³ (local users)
            if (item?.password) {
                const hashedPassword = bcrypt.hashSync(item.password, 10);
                return { ...item, password: hashedPassword };
            }
            // Google users khÃ´ng cÃ³ password
            return { ...item, password: null };
        });

        const result = await this.userModel.bulkCreate(userFormat as any, { 
            transaction,
            validate: true 
        });
        
        console.log(`âœ… Seeded ${result.length} users`);
        return result;
    }

    private async seedAddresses(transaction: Transaction) {
        // âœ… Verify users exist trÆ°á»›c
        const userCount = await this.userModel.count({ transaction });
        if (userCount === 0) {
            throw new Error('Cannot seed addresses: No users found in database');
        }
        
        const result = await this.addressModel.bulkCreate(addresses as any, { 
            transaction,
            validate: true 
        });
        
        console.log(`âœ… Seeded ${result.length} addresses`);
        return result;
    }

    private async seedCategories(transaction: Transaction) {
        const result = await this.categoryModel.bulkCreate(categories as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} categories`);
        return result;
    }

    private async seedProducts(transaction: Transaction) {
        const result = await this.productModel.bulkCreate(products as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} products`);
        return result;
    }

    private async seedIngredients(transaction: Transaction) {
        const result = await this.ingredientModel.bulkCreate(ingredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} ingredients`);
        return result;
    }

    private async seedProductVariants(transaction: Transaction) {
        const result = await this.productVariantModel.bulkCreate(productVariants as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} product variants`);
        return result;
    }

    private async seedProductIngredients(transaction: Transaction) {
        const result = await this.productIngredientModel.bulkCreate(productIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} product ingredients`);
        return result;
    }

    private async seedCombos(transaction: Transaction) {
        const result = await this.comboModel.bulkCreate(combos as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} combos`);
        return result;
    }

    private async seedComboItems(transaction: Transaction) {
        const result = await this.comboItemModel.bulkCreate(comboItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} combo items`);
        return result;
    }

    private async seedCoupons(transaction: Transaction) {
        const result = await this.couponsModel.bulkCreate(coupons as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} coupons`);
        return result;
    }

    private async seedUserCoupons(transaction: Transaction) {
        const result = await this.userCouponsModel.bulkCreate(userCoupons as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} user coupons`);
        return result;
    }

    private async seedCarts(transaction: Transaction) {
        const result = await this.cartsModel.bulkCreate(carts as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} carts`);
        return result;
    }

    private async seedCartItems(transaction: Transaction) {
        const result = await this.cartItemsModel.bulkCreate(cartItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} cart items`);
        return result;
    }

    private async seedCartItemsIngredients(transaction: Transaction) {
        const result = await this.cartItemsIngredientModel.bulkCreate(cartItemsIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} cart items ingredients`);
        return result;
    }

    private async seedOrders(transaction: Transaction) {
        const result = await this.orderModel.bulkCreate(orders as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} orders`);
        return result;
    }

    private async seedOrderItems(transaction: Transaction) {
        const result = await this.orderItemsModel.bulkCreate(orderItems as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} order items`);
        return result;
    }

    private async seedOrderItemIngredients(transaction: Transaction) {
        const result = await this.orderItemIngredientModel.bulkCreate(orderItemIngredients as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} order item ingredients`);
        return result;
    }

    private async seedReviews(transaction: Transaction) {
        const result = await this.reviewsModel.bulkCreate(reviews as any, { 
            transaction,
            validate: true 
        });
        console.log(`âœ… Seeded ${result.length} reviews`);
        return result;
    }

    async seedDevOrders() {
        const transaction = await this.sequelize.transaction();

        try {
            const user = await this.userModel.findOne({ transaction });
            if (!user) throw new BadRequestException('Cannot seed dev orders: no user found');

            let address = await this.addressModel.findOne({
                where: { userId: user.dataValues.id },
                transaction
            });

            if (!address) {
                address = await this.addressModel.create({
                    userId: user.dataValues.id,
                    sessionId: null,
                    recipientName: user.dataValues.name || 'Dev Customer',
                    recipientPhone: user.dataValues.phone || '0987654324',
                    street: 'Dev Street',
                    ward: 'Dev Ward',
                    district: 'Dev District',
                    city: 'Dev City',
                    latitude: 10.762622,
                    longitude: 106.660172,
                    isDefault: false
                } as Address, { transaction });
            }

            const singleVariant = await this.productVariantModel.findOne({
                include: [{ model: Product, required: true }],
                transaction
            });
            if (!singleVariant?.dataValues.product) {
                throw new BadRequestException('Cannot seed dev orders: no product variant found');
            }

            const comboItemRows = await this.comboItemModel.findAll({
                include: [
                    { model: Combo, required: true },
                    { model: Product, required: true },
                    { model: ProductVariant, required: true }
                ],
                order: [['comboId', 'ASC'], ['id', 'ASC']],
                transaction
            });
            if (!comboItemRows.length || !comboItemRows[0].dataValues.combo) {
                throw new BadRequestException('Cannot seed dev orders: no combo with items found');
            }

            const combo = comboItemRows[0].dataValues.combo;
            const comboId = Number(combo.dataValues.id);
            const comboItemsSource = comboItemRows.filter((item) => Number(item.dataValues.comboId) === comboId);
            const firstComboItem = comboItemsSource[0];
            const replacementVariant = await this.productVariantModel.findOne({
                where: {
                    productId: { [Op.ne]: firstComboItem.dataValues.productId }
                },
                include: [{ model: Product, required: true }],
                transaction
            });
            if (!replacementVariant?.dataValues.product) {
                throw new BadRequestException('Cannot seed dev orders: no replacement product variant found');
            }

            const timestamp = Date.now();
            const singleOrder = await this.createDevSingleProductOrder(
                user.dataValues.id,
                address.dataValues.id,
                singleVariant,
                `DEV-SINGLE-${timestamp}`,
                transaction
            );
            const originalComboOrder = await this.createDevComboOrder(
                user.dataValues.id,
                address.dataValues.id,
                combo,
                comboItemsSource,
                null,
                `DEV-COMBO-ORIGINAL-${timestamp}`,
                transaction
            );
            const changedComboOrder = await this.createDevComboOrder(
                user.dataValues.id,
                address.dataValues.id,
                combo,
                comboItemsSource,
                replacementVariant,
                `DEV-COMBO-CHANGED-${timestamp}`,
                transaction
            );

            await transaction.commit();

            return {
                message: 'Dev orders seeded successfully',
                data: {
                    singleProductOrder: singleOrder.dataValues.orderNumber,
                    originalComboOrder: originalComboOrder.dataValues.orderNumber,
                    changedComboOrder: changedComboOrder.dataValues.orderNumber
                }
            };
        } catch (error: any) {
            await transaction.rollback();
            throw new BadRequestException(`Seed dev orders failed: ${error.message}`);
        }
    }

    private async createDevSingleProductOrder(
        userId: number,
        addressId: number,
        variant: ProductVariant,
        orderNumber: string,
        transaction: Transaction
    ) {
        const product = variant.dataValues.product;
        const unitPrice = Number(product.dataValues.basePrice || 0) + Number(variant.dataValues.modifiedPrice || 0);
        const order = await this.orderModel.create({
            orderNumber,
            userId,
            addressId,
            orderStatus: ORDERSTATUS.PENDING,
            paymentMethod: PAYMENTMETHOD.CASH,
            paymentStatus: PAYMENTSTATUS.PENDING,
            subTotal: unitPrice,
            deliveryFee: 15000,
            discount: 0,
            finalTotal: unitPrice + 15000,
            notes: 'DEV seed: single product order',
            paidAt: null,
            cancelledReason: null
        } as Order, { transaction });

        await this.orderItemsModel.create({
            orderId: order.dataValues.id,
            productId: product.dataValues.id,
            productVariantId: variant.dataValues.id,
            comboId: null,
            quantity: 1,
            metadata: {
                itemName: product.dataValues.name,
                originalPrice: unitPrice,
                finalPrice: unitPrice,
                singleItemMetadata: {
                    variantName: this.getVariantDisplayName(variant),
                    ingredients: []
                }
            }
        } as unknown as OrderItems, { transaction });

        return order;
    }

    private async createDevComboOrder(
        userId: number,
        addressId: number,
        combo: Combo,
        comboItemsSource: ComboItem[],
        replacementVariant: ProductVariant | null,
        orderNumber: string,
        transaction: Transaction
    ) {
        const comboBasePrice = Number(combo.dataValues.price || 0);
        const discountedComboPrice = Math.ceil(
            (comboBasePrice * (1 - Number(combo.dataValues.discountPercentage || 0) / 100)) / 1000
        ) * 1000;
        const firstComboItem = comboItemsSource[0];
        const originalVariantPrice = Number(firstComboItem.dataValues.productVariant?.dataValues.modifiedPrice || 0);
        const replacementVariantPrice = replacementVariant ? Number(replacementVariant.dataValues.modifiedPrice || 0) : originalVariantPrice;
        const variantSurcharge = replacementVariant
            ? Math.max(replacementVariantPrice - originalVariantPrice, 0)
            : 0;
        const finalPrice = discountedComboPrice + variantSurcharge;
        const deliveryFee = 15000;
        const comboMetadataItems = comboItemsSource.map((comboItem, index) => this.buildDevComboMetadataItem(
            comboItem,
            index,
            replacementVariant && index === 0 ? replacementVariant : null
        ));

        const order = await this.orderModel.create({
            orderNumber,
            userId,
            addressId,
            orderStatus: ORDERSTATUS.PENDING,
            paymentMethod: PAYMENTMETHOD.CASH,
            paymentStatus: PAYMENTSTATUS.PENDING,
            subTotal: finalPrice,
            deliveryFee,
            discount: 0,
            finalTotal: finalPrice + deliveryFee,
            notes: replacementVariant ? 'DEV seed: combo with replaced product' : 'DEV seed: original combo',
            paidAt: null,
            cancelledReason: null
        } as Order, { transaction });

        const orderItem = await this.orderItemsModel.create({
            orderId: order.dataValues.id,
            productId: null,
            productVariantId: null,
            comboId: combo.dataValues.id,
            quantity: 1,
            metadata: {
                itemName: combo.dataValues.name,
                originalPrice: discountedComboPrice,
                finalPrice,
                totalPrice: finalPrice,
                comboPricing: {
                    basePrice: comboBasePrice,
                    discountedBasePrice: discountedComboPrice,
                    originalPrice: discountedComboPrice,
                    changedPrice: finalPrice,
                    discountPercentage: Number(combo.dataValues.discountPercentage || 0),
                    savedAmount: Math.max(comboBasePrice - discountedComboPrice, 0),
                    variantSurcharge,
                    ingredientSurcharge: 0,
                    totalSurcharge: variantSurcharge,
                    priceAfterChange: finalPrice
                },
                items: comboMetadataItems
            }
        } as unknown as OrderItems, { transaction });

        for (const comboItem of comboItemsSource) {
            const index = comboItemsSource.indexOf(comboItem);
            const selectedVariant = replacementVariant && index === 0 ? replacementVariant : comboItem.dataValues.productVariant;
            const selectedProduct = selectedVariant.dataValues.product || comboItem.dataValues.product;
            const originalVariant = comboItem.dataValues.productVariant;
            const optionVariantSurcharge = replacementVariant && index === 0
                ? Math.max(Number(selectedVariant.dataValues.modifiedPrice || 0) - Number(originalVariant.dataValues.modifiedPrice || 0), 0)
                : 0;

            await this.orderItemComboOptionModel.create({
                orderItemId: orderItem.dataValues.id,
                comboItemId: comboItem.dataValues.id,
                slotIndex: index,
                selectedProductId: selectedProduct.dataValues.id,
                selectedProductVariantId: selectedVariant.dataValues.id,
                productNameSnapshot: selectedProduct.dataValues.name,
                variantNameSnapshot: this.getVariantDisplayName(selectedVariant),
                unitPriceSnapshot: Number(selectedVariant.dataValues.modifiedPrice || 0),
                originalProductNameSnapshot: comboItem.dataValues.product.dataValues.name,
                originalVariantNameSnapshot: this.getVariantDisplayName(originalVariant),
                selectedProductNameSnapshot: selectedProduct.dataValues.name,
                selectedVariantNameSnapshot: this.getVariantDisplayName(selectedVariant),
                originalVariantModifiedPriceSnapshot: Number(originalVariant.dataValues.modifiedPrice || 0),
                selectedVariantModifiedPriceSnapshot: Number(selectedVariant.dataValues.modifiedPrice || 0),
                variantSurchargeSnapshot: optionVariantSurcharge,
                ingredientSurchargeSnapshot: 0,
                surchargeSnapshot: optionVariantSurcharge
            } as OrderItemComboOption, { transaction });
        }

        return order;
    }

    private buildDevComboMetadataItem(
        comboItem: ComboItem,
        slotIndex: number,
        replacementVariant: ProductVariant | null
    ) {
        const originalProduct = comboItem.dataValues.product;
        const originalVariant = comboItem.dataValues.productVariant;
        const selectedVariant = replacementVariant || originalVariant;
        const selectedProduct = replacementVariant?.dataValues.product || originalProduct;
        const isChanged = Boolean(replacementVariant);
        const variantSurcharge = isChanged
            ? Math.max(Number(selectedVariant.dataValues.modifiedPrice || 0) - Number(originalVariant.dataValues.modifiedPrice || 0), 0)
            : 0;

        return {
            comboItemId: Number(comboItem.dataValues.id),
            slotIndex,
            productId: Number(selectedProduct.dataValues.id),
            productName: selectedProduct.dataValues.name,
            variantId: Number(selectedVariant.dataValues.id),
            variantName: this.getVariantDisplayName(selectedVariant),
            originalProductName: originalProduct.dataValues.name,
            originalVariantName: this.getVariantDisplayName(originalVariant),
            changedProductName: isChanged ? selectedProduct.dataValues.name : null,
            changedVariantName: isChanged ? this.getVariantDisplayName(selectedVariant) : null,
            unitPrice: Number(selectedVariant.dataValues.modifiedPrice || 0),
            originalVariantModifiedPrice: Number(originalVariant.dataValues.modifiedPrice || 0),
            selectedVariantModifiedPrice: Number(selectedVariant.dataValues.modifiedPrice || 0),
            variantSurcharge,
            ingredientSurcharge: 0,
            surcharge: variantSurcharge,
            ingredients: []
        };
    }

    private getVariantDisplayName(variant: ProductVariant) {
        return [variant.dataValues.size, variant.dataValues.type]
            .filter((value) => value && value !== 'DEFAULT')
            .join(' - ');
    }

    async runAllSeeder() {
        console.log('ðŸ§¹ Clearing existing seed data before reseeding...');
        await this.clearAllData();

        const transaction = await this.sequelize.transaction();

        try {
            console.log('ðŸŒ± Starting seeder...\n');

            // 1. Base data (khÃ´ng cÃ³ dependency)
            console.log('ðŸ“ Seeding users...');
            await this.seedUser(transaction);

            console.log('ðŸ“ Seeding categories...');
            await this.seedCategories(transaction);

            // 2. User-related data
            console.log('ðŸ“ Seeding addresses...');
            await this.seedAddresses(transaction);

            // 3. Product data
            console.log('ðŸ“ Seeding products...');
            await this.seedProducts(transaction);

            console.log('ðŸ“ Seeding ingredients...');
            await this.seedIngredients(transaction);

            console.log('ðŸ“ Seeding product variants...');
            await this.seedProductVariants(transaction);

            console.log('ðŸ“ Seeding product ingredients...');
            await this.seedProductIngredients(transaction);

            // 4. Combo data
            console.log('ðŸ“ Seeding combos...');
            await this.seedCombos(transaction);

            console.log('ðŸ“ Seeding combo items...');
            await this.seedComboItems(transaction);

            // 5. Coupon data
            console.log('ðŸ“ Seeding coupons...');
            await this.seedCoupons(transaction);

            console.log('ðŸ“ Seeding user coupons...');
            await this.seedUserCoupons(transaction);

            // 6. Cart data
            console.log('ðŸ“ Seeding carts...');
            await this.seedCarts(transaction);

            console.log('ðŸ“ Seeding cart items...');
            await this.seedCartItems(transaction);

            console.log('ðŸ“ Seeding cart items ingredients...');
            await this.seedCartItemsIngredients(transaction);

            // 7. Order data
            console.log('ðŸ“ Seeding orders...');
            await this.seedOrders(transaction);

            console.log('ðŸ“ Seeding order items...');
            await this.seedOrderItems(transaction);

            console.log('ðŸ“ Seeding order item ingredients...');
            await this.seedOrderItemIngredients(transaction);

            // 8. Review data (cuá»‘i cÃ¹ng)
            console.log('ðŸ“ Seeding reviews...');
            await this.seedReviews(transaction);

            await transaction.commit();
            
            console.log('\nâœ… Seeder completed successfully!');
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
        } catch (error: any) {
            await transaction.rollback();
            console.error('\nâŒ Seeding failed:', error.message);
            console.error('Error details:', error);
            throw new BadRequestException(`Seed Failed: ${error.message}`);
        }
    }

    // Method Ä‘á»ƒ clear táº¥t cáº£ data (useful cho testing)
    // Sá»­a láº¡i Ä‘oáº¡n code clearAllData trong file seeder.service.ts

    async clearAllData() {
        const transaction = await this.sequelize.transaction();

        try {
            console.log('ðŸ—‘ï¸  Clearing all data...\n');

            // Sá»­ dá»¥ng option: { truncate: true, cascade: true, restartIdentity: true }
            // restartIdentity: true -> Reset ID vá» 1 (Chá»‰ work tá»‘t trÃªn Postgres)
            // cascade: true -> XÃ³a luÃ´n dá»¯ liá»‡u báº£ng con liÃªn quan (Ä‘á»¡ pháº£i xÃ³a ngÆ°á»£c tá»«ng báº£ng)
            
            // XÃ³a theo thá»© tá»± Ä‘á»ƒ an toÃ n, nhÆ°ng quan trá»ng nháº¥t lÃ  cÃ¡c báº£ng cha (Users, Categories...) cáº§n restartIdentity
            
            // XÃ³a cÃ¡c báº£ng phá»¥ trÆ°á»›c (hoáº·c dÃ¹ng cascade á»Ÿ báº£ng cha cÅ©ng Ä‘Æ°á»£c, nhÆ°ng viáº¿t rÃµ cho an toÃ n)
            await this.reviewsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.orderItemIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.orderItemsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.orderModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            
            await this.cartItemComboOptionIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.cartItemComboOptionModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.cartItemsIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.cartItemsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.cartsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            
            await this.userCouponsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.couponsModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            
            await this.comboItemModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.comboModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            
            await this.productIngredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.productVariantModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.ingredientModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            
            // QUAN TRá»ŒNG: CÃ¡c báº£ng nÃ y Ä‘Æ°á»£c tham chiáº¿u bá»Ÿi báº£ng khÃ¡c, cáº§n reset ID vá» 1
            await this.productModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.addressModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.categoryModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });
            await this.userModel.destroy({ truncate: true, cascade: true, restartIdentity: true, force: true, transaction });

            await transaction.commit();
            console.log('âœ… All data cleared and IDs reset!\n');

            return { message: "All data cleared successfully!" };
        } catch (error: any) {
            await transaction.rollback();
            console.error('âŒ Clear data failed:', error);
            throw new BadRequestException(`Clear data failed: ${error.message}`);
        }
    }
}
