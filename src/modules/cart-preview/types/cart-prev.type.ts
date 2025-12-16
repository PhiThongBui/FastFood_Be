

export interface CartPreviewItem {
    cartItemId: number;
    type: 'SINGLE' | 'COMBO'; // Phân loại
    name: string;             // Tên món hoặc Tên Combo
    unitPrice: number;        // Giá đơn vị (đã cộng topping)
    quantity: number;
    totalPrice: number;       // unitPrice * quantity
    imageUrl: string;
    
    // Chi tiết (Optional)
    details?: {
        variantName?: string;
        size?: string;
        crust?: string; // Type đế bánh
        ingredients?: { name: string; price: number; type?: string }[];    
        originalPrice?: number;
        savedAmount?: number;
        // Dành cho Combo: Danh sách các món con
        comboItems?: {
            productName: string;
            variantName: string;
            ingredients: string[]; // Tên topping thêm/bớt
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