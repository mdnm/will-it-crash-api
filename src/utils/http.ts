export interface HttpError {
    statusCode: number;
    message: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHttpError(error: any): error is HttpError {
    return 'statusCode' in error;
}

export function getCorsHeaders() {
    return {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
    };
}
