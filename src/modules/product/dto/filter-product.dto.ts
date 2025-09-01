import { BooleanNotRequired, NumberNotRequired, StringNotRequired } from '@/common/decorators';
export class filterProductDto{
    @StringNotRequired
    name?: string

    @NumberNotRequired
    categoryId?:number

    @BooleanNotRequired
    isFeatured?: boolean

    @BooleanNotRequired
    isActive?: boolean

    @NumberNotRequired
    page?: number

    @NumberNotRequired
    limit?: number

    @StringNotRequired
    sortBy?: string

    @StringNotRequired
    sortOrder?: string

    @NumberNotRequired
    minPrice:number

    @NumberNotRequired
    maxPrice:number
}