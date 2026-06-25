

export interface CartPreviewItem {
    cartItemId: number;
    type: 'SINGLE' | 'COMBO';
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    imageUrl: string;
    
    // ✅ THÊM: Raw data để restore modal
    rawData?: {
        // For SINGLE
        productId?: number;
        productVariantId?: number;
        
        // For COMBO
        comboId?: number;
        selectedOptions?: Array<{
            productId: number;
            productVariantId: number;
            comboItemId?: number;
            slotIndex?: number;
            originalProductId?: number;
            originalProductVariantId?: number;
            ingredients?: Array<{
                ingredientId: number;
                quantity: number;
                type: 'ADD' | 'REMOVE';
                name?: string;
                price?: number;
            }>;
            // ✅ Enriched data
            product?: {
                id: number;
                name: string;
                imageUrl?: string;
                basePrice: number;
            };
            variant?: {
                id: number;
                name: string;
                size: string;
                type: string;
                modifiedPrice: number;
            };
        }>;
    };
    
    // Chi tiết hiển thị
    details?: {
        variantName?: string;
        size?: string;
        crust?: string;
        ingredients?: {
            name: string;
            price: number;
            quantity?: number;
            totalPrice?: number;
            type?: 'ADD' | 'REMOVE';
        }[];
        discountPercentage?: number;
        savedAmount?: number;
        originalPrice?: number;  
        comboItems?: {
            productName: string;
            variantName: string;
            ingredients: string[];
        }[];
    };
}
export interface CartPreviewOutput {
    message: string;
    data: {
        items: CartPreviewItem[];
        totalAmount: number;
    }
}

export type CartCheckoutOutput = {
    message:string,
    data:{
        items: CartPreviewItem[],
        subtotal: number,
        deliveryFee: number,
        discount : number,
        finalTotal: number,
        appliedCoupon?: {
            code: string;
            type: string;
            value: number;
        };
    }
}
