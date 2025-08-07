import { BooleanNotRequired, NumberNotRequired, StringNotRequired, StringRequired } from "@/common/decorators";
export class CreateCategoryDto {
   
    @StringRequired('Tên danh mục')
    name: string;
    
    @StringNotRequired
    description?: string;

    @NumberNotRequired
    sortOrder?: number;

    @BooleanNotRequired
    isActive?: boolean
}
