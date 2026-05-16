import zhCN from './langs/zh-cn';
import enUS from './langs/en-us';
import bizZhCN from './langs/biz-zh-cn';
import bizEnUS from './langs/biz-en-us';

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

const locales: Record<App.I18n.LangType, any> = {
  'zh-CN': deepMerge(zhCN, bizZhCN),
  'en-US': deepMerge(enUS, bizEnUS)
};

export default locales;
