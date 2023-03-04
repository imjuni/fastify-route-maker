import type { TRouteOption } from '#configs/interfaces/TRouteOption';
import type { TWatchOption } from '#configs/interfaces/TWatchOption';
import getRoutePath from '#routes/getRoutePath';
import getSummaryByMethod from '#routes/getSummaryByMethod';
import { CE_ROUTE_INFO_KIND } from '#routes/interface/CE_ROUTE_INFO_KIND';
import { CE_ROUTE_METHOD } from '#routes/interface/CE_ROUTE_METHOD';
import type { TPickRouteInfo } from '#routes/interface/TRouteInfo';

export default async function summaryRouteHandlerFile(
  filePaths: string[],
  option: Pick<TRouteOption, 'handler' | 'cwd'> | Pick<TWatchOption, 'handler' | 'cwd'>,
): Promise<TPickRouteInfo<typeof CE_ROUTE_INFO_KIND.SUMMARY_ROUTE_HANDLER_FILE>> {
  const summary = getSummaryByMethod(filePaths, option);

  const [
    getHandlers,
    postHandlers,
    putHandlers,
    deleteHandlers,
    patchHandlers,
    optionsHandlers,
    headHandlers,
    allHandlers,
  ] = await Promise.all([
    Promise.all(summary[CE_ROUTE_METHOD.GET].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.POST].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.PUT].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.DELETE].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.PATCH].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.OPTIONS].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.HEAD].map(async (handler) => getRoutePath(handler.filePath))),
    Promise.all(summary[CE_ROUTE_METHOD.ALL].map(async (handler) => getRoutePath(handler.filePath))),
  ]);

  const handlerMap: Record<CE_ROUTE_METHOD, TPickRouteInfo<typeof CE_ROUTE_INFO_KIND.ROUTE>[]> = {
    get: getHandlers,
    post: postHandlers,
    put: putHandlers,
    delete: deleteHandlers,
    patch: patchHandlers,
    options: optionsHandlers,
    head: headHandlers,
    all: allHandlers,
  };

  return { kind: CE_ROUTE_INFO_KIND.SUMMARY_ROUTE_HANDLER_FILE, summary: handlerMap };
}