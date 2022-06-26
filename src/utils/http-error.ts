export interface HttpError {
    statusCode: number;
    message: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHttpError(error: any): error is HttpError {
    return 'statusCode' in error;
}
