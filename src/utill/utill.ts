import * as jwt from 'jsonwebtoken';

export function extractTokenFromHeaders(headers: any): string | null {
    const authHeader = headers.authorization;
    if (!authHeader) {
        return null;
    }
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
        return null;
    }
    return token;
}

export function verifyAndExtractToken(headers: any) {
    const authHeader = headers.authorization;
    if (!authHeader) {
        return null;
    }
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
        return null;
    }
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
        console.log('Decoded JWT Token:', decoded);
        return decoded
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return null;
    }
}

export function decodeJWTToken(headers: any) {
    const authHeader = headers.authorization;
    if (!authHeader) {
        return null;
    }
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
        return null;
    }
    return jwt.decode(token);
}