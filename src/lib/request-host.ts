import {createIsomorphicFn} from "@tanstack/react-start";
import {getRequestHost} from "@tanstack/react-start/server";

/** Host name of the current request (server) or page (browser), without port. */
export const getSiteHost = createIsomorphicFn()
    .server(() => getRequestHost({xForwardedHost: true}).split(":")[0])
    .client(() => window.location.hostname);
