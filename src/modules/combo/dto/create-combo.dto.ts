import { BooleanNotRequired, NumberNotRequired, NumberRequired, StringNotRequired, StringRequired } from "@/common/decorators";
import { ComboItems } from "@/common/decorators/combo.decorator";

export class ComboItemDto{
    @NumberRequired('Id prodct', 1)
    productId:number

    @NumberNotRequired
    productVariantId?: number

    @NumberRequired('Số lượng', 1)
    quantity: number
}

export class CreateComboDto{
    @StringRequired('Tên combo: ')
    name: string
    
    @StringNotRequired
    description?: string

    @NumberRequired('Giá combo: ')
    price: number

    @StringRequired('Link hình ảnh: ')
    imageUrl: string
 
    @BooleanNotRequired
    isFeatured?: boolean

    @NumberNotRequired
    categoryId?: number

    @ComboItems()
    comboItems: ComboItemDto[]
}

