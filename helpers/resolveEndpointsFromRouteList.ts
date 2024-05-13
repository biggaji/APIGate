import { gatewayConfigObject } from './loadGatewayConfig';

/**
 *
 * @param path
 * @param method
 */
export function resolveEndpointFromRouteList(path: string, method: string, authHeader?: any) {
  // It should take the whole request
  try {
    console.log(method, path);
    let jwtPayload = {};
    const definedRouteList: any[] = gatewayConfigObject.routes;

    // Check path match
    const pathMatchRoute = definedRouteList.find((route) => {
      return route.path === path;
    });

    if (!pathMatchRoute) {
      throw new Error(`Cannot ${method} ${path}`);
    }

    // Check if method is allowed if path match
    const isAllowedMethod = pathMatchRoute.methods.includes(method);

    if (!isAllowedMethod) {
      throw new Error(`Method '${method}' not allowed`);
    }

    console.log('Method allowed?:', isAllowedMethod);

    // Check if authentication is required
    // const requiresAuth = pathMatchRoute.authentication.type !== 'none';
    // console.log('Requires authentication?:', requiresAuth);

    // if (requiresAuth) {
    //   // Check if user passes auth requirements
    //   // For now it's jwt
    //   if (!authHeader.jwt) {
    //     throw new Error('jwt is missing');
    //   }
    //   jwtPayload = validateJWT(authHeader.jwt, 'secret');
    // }

    // Check authorization scope
    // const authScope = pathMatchRoute.authorization;

    // if (authScope && authScope.roles) {
    //   handleRBAC(authScope.roles, authHeader.role);
    // }

    // if (authScope && authScope.permissions) {
    //   handlePermissionScope(authScope.permissions, authHeader.permission);
    // }

    // Return redirect url if all is successful, else throw error or return null
    return { target: pathMatchRoute.target, jwtPayload };
  } catch (error: any) {
    console.log('Error resolving endpoint from route list in gateway:', error.message);
    throw error;
  }
}
