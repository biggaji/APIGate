import jwt from 'jsonwebtoken';
const { JsonWebTokenError } = jwt;

/**
 * Validates a JSON Web Token (JWT).
 * @param token - The JWT to be validated.
 * @param secretKey - The secret key used for JWT verification.
 * @returns {object} The payload if the token is valid.
 * @throws {Error} If the token or secretKey is not provided, or if the token is invalid or expired.
 */
function validateJWT(token: string, secretKey: string) {
  try {
    if (!token) {
      throw new Error("Can't validate an empty or undefined token");
    }

    if (!secretKey) {
      throw new Error('Jwt secret not provided');
    }

    const payload = jwt.verify(token, secretKey);
    return payload;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new Error('Invalid or expired access token');
    }
    throw error;
  }
}

/**
 * Handles Role-Based Access Control (RBAC) by checking if the user role is authorized.
 * @param allowedRoleList - An array of allowed roles for accessing a resource.
 * @param userRole - The role of the user attempting to access the resource.
 * @throws {Error} Throws an error with a descriptive message if access is denied.
 */
function handleRBAC(allowedRoleList: string[], userRole: string) {
  if (!allowedRoleList.includes(userRole)) {
    throw new Error(`Access denied: role '${userRole}' not authorized.`);
  }
}

/**
 * Handles permission scope control for a resource by checking the user role.
 * @param allowedPermissions - The role of the authenticated user.
 * @param userPermissionScope - A boolean to indicate if the request is a write request or if it modifies data.
 * @throws {Error} Throws an error with a descriptive message if the user doesn't have write permission.
 */
function handlePermissionScope(allowedPermissions: string[], userPermissionScope: string) {
  if (!allowedPermissions.includes(userPermissionScope)) {
    throw new Error("Access denied: Request doesn't include neccessary permissions.");
  }
}
