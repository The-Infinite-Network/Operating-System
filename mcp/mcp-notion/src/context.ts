import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  ventureId?: string;
  userHandle?: string;
  userName?: string;
  userId?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  return contextStorage.getStore() || {};
}
