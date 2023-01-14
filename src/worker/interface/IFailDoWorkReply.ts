import type ILogBox from '#module/logging/interface/ILogBox';
import type TMethodType from '#route/interface/TMethodType';

export default interface IFailDoWorkReply {
  type: 'fail';
  method: TMethodType;
  fail: { log: ILogBox; err: Error };
}
