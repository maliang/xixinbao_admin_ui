import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock @/service/api 避免导入链触发 .vue 文件解析
vi.mock('@/service/api', () => ({
  fetchActiveLocales: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

/**
 * useLanguageEditor Property-Based Tests
 *
 * 测试 useLanguageEditor composable 的核心逻辑属性：
 * - Property 2: 语言切换 round-trip（编辑器状态保持）
 * - Property 3: buildPayload 正确分离主字段和翻译
 */

// ===== 生成器 =====

/** 支持的非 zh-CN 语言代码 */
const NON_ZH_LOCALES = ['en', 'ja', 'ko', 'zh-TW', 'vi', 'ar', 'bn'];

/** 所有支持的语言代码 */
const ALL_LOCALES = ['zh-CN', ...NON_ZH_LOCALES];

/** 生成合法的字段名（1-3 个字段） */
const fieldsArb = fc.uniqueArray(
  fc.stringMatching(/^[a-z][a-z_]{1,10}$/),
  { minLength: 1, maxLength: 3 }
);

/** 生成非空字符串内容（模拟表单输入） */
const contentArb = fc.string({ minLength: 1, maxLength: 50 });

/** 生成可能为空的字符串内容 */
const optionalContentArb = fc.oneof(fc.constant(''), contentArb);

/** 生成字段值映射（给定字段列表） */
function fieldValuesArb(fields: string[]): fc.Arbitrary<Record<string, string>> {
  if (fields.length === 0) return fc.constant({});
  return fc.tuple(...fields.map(() => contentArb)).map(values => {
    const result: Record<string, string> = {};
    fields.forEach((f, i) => {
      result[f] = values[i];
    });
    return result;
  });
}

/** 生成翻译数据（给定字段列表，1-3 个非 zh-CN 语言） */
function translationsArb(fields: string[]): fc.Arbitrary<Record<string, Record<string, string>>> {
  return fc.uniqueArray(fc.constantFrom(...NON_ZH_LOCALES), { minLength: 1, maxLength: 3 }).chain(locales => {
    const entries = locales.map(locale =>
      fc.tuple(...fields.map(() => optionalContentArb)).map(values => {
        const fieldMap: Record<string, string> = {};
        fields.forEach((f, i) => {
          fieldMap[f] = values[i];
        });
        return [locale, fieldMap] as [string, Record<string, string>];
      })
    );
    return fc.tuple(...entries).map(pairs => {
      const result: Record<string, Record<string, string>> = {};
      for (const [locale, fieldMap] of pairs) {
        result[locale] = fieldMap;
      }
      return result;
    });
  });
}

/** 生成两个不同的语言代码 */
const twoDistinctLocalesArb = fc.tuple(
  fc.constantFrom(...ALL_LOCALES),
  fc.constantFrom(...ALL_LOCALES)
).filter(([a, b]) => a !== b);

// ===== Property 2: 语言切换 round-trip =====

describe('Feature: content-i18n, Property 2: 语言切换 round-trip（编辑器状态保持）', () => {
  /**
   * **Validates: Requirements 2.9**
   *
   * Property 2: 对于任意初始主字段数据和 translations 数据，以及任意两个不同的 locale，
   * 在编辑器中设置内容后切换到另一语言再切回，表单字段值应与切换前完全一致。
   */

  it('切换到另一语言再切回后，表单字段值应与切换前完全一致', () => {
    fc.assert(
      fc.property(
        fieldsArb,
        fc.constantFrom(...ALL_LOCALES),
        fc.constantFrom(...NON_ZH_LOCALES),
        (fields, startLang, otherLang) => {
          // 确保 startLang 和 otherLang 不同
          fc.pre(startLang !== otherLang);

          const { initEditor, switchLang, formFields } = useLanguageEditor({ fields });

          // 生成初始数据
          const mainData: Record<string, string> = {};
          fields.forEach((f, i) => {
            mainData[f] = `zh_value_${i}_${f}`;
          });

          const transData: Record<string, Record<string, string>> = {};
          // 为 otherLang 和 startLang（如果非 zh-CN）生成翻译数据
          for (const lang of NON_ZH_LOCALES) {
            transData[lang] = {};
            fields.forEach((f, i) => {
              transData[lang][f] = `${lang}_value_${i}_${f}`;
            });
          }

          // 初始化编辑器
          initEditor(mainData, transData);

          // 切换到 startLang
          switchLang(startLang);

          // 记录切换前的表单值
          const beforeSwitch: Record<string, string> = {};
          fields.forEach(f => {
            beforeSwitch[f] = formFields.value[f];
          });

          // 切换到 otherLang
          switchLang(otherLang);

          // 切回 startLang
          switchLang(startLang);

          // 验证表单值与切换前一致
          for (const f of fields) {
            if (formFields.value[f] !== beforeSwitch[f]) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('使用随机内容编辑后切换语言再切回，编辑内容应保持不变', () => {
    fc.assert(
      fc.property(
        fieldsArb,
        twoDistinctLocalesArb,
        (fields, [langA, langB]) => {
          const { initEditor, switchLang, formFields } = useLanguageEditor({ fields });

          // 初始化为空
          const mainData: Record<string, string> = {};
          fields.forEach(f => { mainData[f] = ''; });
          initEditor(mainData, {});

          // 切换到 langA
          switchLang(langA);

          // 在 langA 下编辑内容
          fields.forEach((f, i) => {
            formFields.value[f] = `edited_${langA}_${f}_${i}`;
          });

          // 记录编辑后的值
          const editedValues: Record<string, string> = {};
          fields.forEach(f => {
            editedValues[f] = formFields.value[f];
          });

          // 切换到 langB
          switchLang(langB);

          // 切回 langA
          switchLang(langA);

          // 验证编辑内容保持不变
          for (const f of fields) {
            if (formFields.value[f] !== editedValues[f]) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('多次连续切换后状态仍然保持一致', () => {
    fc.assert(
      fc.property(
        fieldsArb,
        fc.array(fc.constantFrom(...ALL_LOCALES), { minLength: 2, maxLength: 8 }),
        (fields, langSequence) => {
          const { initEditor, switchLang, formFields } = useLanguageEditor({ fields });

          // 初始化编辑器，为每种语言设置不同内容
          const mainData: Record<string, string> = {};
          fields.forEach(f => { mainData[f] = `zh_${f}`; });

          const transData: Record<string, Record<string, string>> = {};
          for (const lang of NON_ZH_LOCALES) {
            transData[lang] = {};
            fields.forEach(f => { transData[lang][f] = `${lang}_${f}`; });
          }

          initEditor(mainData, transData);

          // 执行语言切换序列
          for (const lang of langSequence) {
            switchLang(lang);
          }

          // 最终语言
          const finalLang = langSequence[langSequence.length - 1];

          // 验证最终表单值与该语言的预期值一致
          for (const f of fields) {
            const expected = finalLang === 'zh-CN' ? `zh_${f}` : `${finalLang}_${f}`;
            if (formFields.value[f] !== expected) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== Property 3: buildPayload 正确分离主字段和翻译 =====

describe('Feature: content-i18n, Property 3: buildPayload 正确分离主字段和翻译', () => {
  /**
   * **Validates: Requirements 2.10, 3.1**
   *
   * Property 3: 对于任意通过编辑器设置的多语言内容（zh-CN 主字段 + 若干非 zh-CN 翻译），
   * 调用 buildPayload 后，zhFields 应包含 zh-CN 的所有字段值，
   * translationsJson 反序列化后应包含所有非 zh-CN 且非空的翻译内容，且不包含 zh-CN 的数据。
   */

  it('zhFields 应包含所有 zh-CN 字段值', () => {
    fc.assert(
      fc.property(
        fieldsArb.chain(fields =>
          fc.tuple(
            fc.constant(fields),
            fieldValuesArb(fields),
            translationsArb(fields)
          )
        ),
        ([fields, mainData, transData]) => {
          const { initEditor, buildPayload } = useLanguageEditor({ fields });

          initEditor(mainData, transData);

          const { zhFields } = buildPayload();

          // zhFields 应包含所有 zh-CN 字段值
          for (const f of fields) {
            if (zhFields[f] !== mainData[f]) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('translationsJson 不应包含 zh-CN 数据', () => {
    fc.assert(
      fc.property(
        fieldsArb.chain(fields =>
          fc.tuple(
            fc.constant(fields),
            fieldValuesArb(fields),
            translationsArb(fields)
          )
        ),
        ([fields, mainData, transData]) => {
          const { initEditor, buildPayload } = useLanguageEditor({ fields });

          initEditor(mainData, transData);

          const { translationsJson } = buildPayload();
          const parsed = JSON.parse(translationsJson) as Record<string, Record<string, string>>;

          // translationsJson 中不应包含 zh-CN
          return !('zh-CN' in parsed);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('translationsJson 应包含所有非空的非 zh-CN 翻译内容', () => {
    fc.assert(
      fc.property(
        fieldsArb.chain(fields =>
          fc.tuple(
            fc.constant(fields),
            fieldValuesArb(fields),
            translationsArb(fields)
          )
        ),
        ([fields, mainData, transData]) => {
          const { initEditor, buildPayload } = useLanguageEditor({ fields });

          initEditor(mainData, transData);

          const { translationsJson } = buildPayload();
          const parsed = JSON.parse(translationsJson) as Record<string, Record<string, string>>;

          // 对于 transData 中每个有非空内容的语言，应出现在 parsed 中
          for (const [lang, fieldMap] of Object.entries(transData)) {
            const hasNonEmptyContent = fields.some(f => !!fieldMap[f]);
            if (hasNonEmptyContent) {
              // 该语言应存在于 payload 中
              if (!(lang in parsed)) return false;
              // 每个字段值应匹配
              for (const f of fields) {
                if (parsed[lang][f] !== (fieldMap[f] || '')) {
                  return false;
                }
              }
            } else {
              // 所有字段为空的语言不应出现在 payload 中
              if (lang in parsed) return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('编辑多种语言后 buildPayload 正确分离所有内容', () => {
    fc.assert(
      fc.property(
        fieldsArb,
        fc.uniqueArray(fc.constantFrom(...NON_ZH_LOCALES), { minLength: 1, maxLength: 3 }),
        (fields, editLocales) => {
          const { initEditor, switchLang, formFields, buildPayload } = useLanguageEditor({ fields });

          // 初始化为空
          const mainData: Record<string, string> = {};
          fields.forEach(f => { mainData[f] = ''; });
          initEditor(mainData, {});

          // 编辑 zh-CN 内容
          const zhValues: Record<string, string> = {};
          fields.forEach((f, i) => {
            const val = `zh_content_${i}`;
            formFields.value[f] = val;
            zhValues[f] = val;
          });

          // 编辑各非 zh-CN 语言内容
          const expectedTrans: Record<string, Record<string, string>> = {};
          for (const lang of editLocales) {
            switchLang(lang);
            expectedTrans[lang] = {};
            fields.forEach((f, i) => {
              const val = `${lang}_content_${i}`;
              formFields.value[f] = val;
              expectedTrans[lang][f] = val;
            });
          }

          // 构建 payload
          const { zhFields, translationsJson } = buildPayload();
          const parsed = JSON.parse(translationsJson) as Record<string, Record<string, string>>;

          // 验证 zhFields
          for (const f of fields) {
            if (zhFields[f] !== zhValues[f]) return false;
          }

          // 验证 translations 不含 zh-CN
          if ('zh-CN' in parsed) return false;

          // 验证各语言翻译内容
          for (const lang of editLocales) {
            if (!(lang in parsed)) return false;
            for (const f of fields) {
              if (parsed[lang][f] !== expectedTrans[lang][f]) return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
