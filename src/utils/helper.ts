export class Helper {
    static converttoSlug(str: string): string {
        return str
            .normalize('NFD')                      // Tách dấu ra khỏi chữ (e.g., "ế" -> "e" + "́")
            .replace(/[\u0300-\u036f]/g, '')       // Xóa các dấu
            .replace(/đ/g, 'd')                    // Chuyển "đ" thành "d"
            .replace(/Đ/g, 'd')                    // Chuyển "Đ" thành "d"
            .toLowerCase()                         // Chuyển về chữ thường
            .trim()                                // Xóa khoảng trắng đầu cuối
            .replace(/[^a-z0-9\s-]/g, '')          // Xóa ký tự không mong muốn
            .replace(/\s+/g, '-')                  // Thay khoảng trắng bằng dấu gạch ngang
            .replace(/-+/g, '-');                  // Loại bỏ dấu gạch ngang thừa vd: xin chao--
    }

}