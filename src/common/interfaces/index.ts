export interface ApiResponse<T>{
    success: boolean;
    message: string;
    data?: T,
    error?: string | string[],
    date?: string,
    path?: string,
    takenTime?: string
}