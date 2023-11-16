/*
 * クライアントに返すエラーを表現する型と、それを返す関数を定義します。
 */

export interface ClientError extends Error {
    status: number;
}

export class NotFoundError implements ClientError {
    name: string;
    message: string;
    stack?: string | undefined;
    cause?: unknown;
    status: number = 404

    constructor(message: string, cause?: unknown) {
        this.name = "Not Found"
        this.message = message
        this.cause = cause
    }
}

export class BadRequestError implements ClientError {
    name: string;
    message: string;
    stack?: string | undefined;
    cause?: unknown;
    status: number = 400

    constructor(message: string, cause?: unknown) {
        this.name = "Bad Request"
        this.message = message
        this.cause = cause
    }    
}

export function problemResponse(error: ClientError): Response {
    return new Response(JSON.stringify({
        type: "about:blank",
        title: error.name,
        messages: [error.message],
    }), {
        status: error.status,
        headers: {
            "Content-Type": "application/problem+json",
        }
    })
}