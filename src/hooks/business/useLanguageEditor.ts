import { ref, type Ref } from 'vue';
import { fetchActiveLocales, type LocaleItem } from '@/service/api';

export type { LocaleItem };

interface UseLanguageEditorOptions {
  /** 可翻译的字段名列表 */
  fields: string[];
}

/**
 * 多语言编辑 Composable
 *
 * 用法：
 * const { currentLang, locales, formFields, switchLang, initEditor, buildPayload }
 *   = useLanguageEditor({ fields: ['title', 'content'] });
 *
 * // 组件 mounted 时加载语言列表
 * await loadLocales();
 */
export function useLanguageEditor(options: UseLanguageEditorOptions) {
  const { fields } = options;

  /** 从 locales 表获取的语言列表 */
  const locales: Ref<LocaleItem[]> = ref([]);

  /** 当前编辑的语言 */
  const currentLang: Ref<string> = ref('zh-CN');

  /** 非 zh-CN 语言的翻译数据 */
  const translations: Ref<Record<string, Record<string, string>>> = ref({});

  /** zh-CN 主字段数据缓存 */
  const zhData: Ref<Record<string, string>> = ref({});

  /** 当前表单字段值（响应式，绑定到表单） */
  const formFields: Ref<Record<string, string>> = ref({});

  // 初始化 formFields
  fields.forEach(f => {
    formFields.value[f] = '';
  });

  /**
   * 从后端加载启用的语言列表
   */
  async function loadLocales() {
    const { data, error } = await fetchActiveLocales();
    if (!error && data) {
      locales.value = data;
    }
  }

  /**
   * 保存当前语言的编辑内容到内存
   */
  function saveCurrentContent() {
    const lang = currentLang.value;
    if (lang === 'zh-CN') {
      fields.forEach(f => {
        zhData.value[f] = formFields.value[f] || '';
      });
    } else {
      translations.value[lang] = {};
      fields.forEach(f => {
        translations.value[lang][f] = formFields.value[f] || '';
      });
    }
  }

  /**
   * 加载指定语言的内容到表单
   */
  function loadContent(lang: string) {
    if (lang === 'zh-CN') {
      fields.forEach(f => {
        formFields.value[f] = zhData.value[f] || '';
      });
    } else {
      const trans = translations.value[lang] || {};
      fields.forEach(f => {
        formFields.value[f] = trans[f] || '';
      });
    }
  }

  /**
   * 切换语言 Tab
   */
  function switchLang(lang: string) {
    saveCurrentContent();
    currentLang.value = lang;
    loadContent(lang);
  }

  /**
   * 初始化编辑器（打开编辑弹窗时调用）
   * @param mainData zh-CN 主字段数据
   * @param transData translations 对象（从 API 获取）
   */
  function initEditor(mainData: Record<string, string>, transData: Record<string, Record<string, string>>) {
    currentLang.value = 'zh-CN';
    zhData.value = { ...mainData };
    translations.value = transData ? JSON.parse(JSON.stringify(transData)) : {};
    loadContent('zh-CN');
  }

  /**
   * 构建提交 payload
   * @returns { zhFields: Record<string, string>, translationsJson: string }
   */
  function buildPayload(): { zhFields: Record<string, string>; translationsJson: string } {
    saveCurrentContent();

    const cleanTranslations = { ...translations.value };
    // 移除空内容的语言
    Object.keys(cleanTranslations).forEach(lang => {
      const hasContent = fields.some(f => !!cleanTranslations[lang]?.[f]);
      if (!hasContent) delete cleanTranslations[lang];
    });

    return {
      zhFields: { ...zhData.value },
      translationsJson: JSON.stringify(cleanTranslations)
    };
  }

  return {
    currentLang,
    locales,
    translations,
    formFields,
    loadLocales,
    switchLang,
    initEditor,
    buildPayload,
    saveCurrentContent
  };
}
