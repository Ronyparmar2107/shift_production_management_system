// Reads the `exp` claim (seconds since epoch) from a JWT without verifying it.
// Verification is the server's job; this is only to avoid using a token we know is dead.
export function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return false;
        return payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}
