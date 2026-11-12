// Offline TS/TSX loading for node:test. Uses Web's existing TypeScript dependency.
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/navigation')
      return {
        url: new URL('./navigation.mjs', import.meta.url).href,
        shortCircuit: true,
      };
    try {
      return next(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') || specifier === 'next/link') {
        for (const extension of ['.ts', '.tsx', '.js']) {
          try {
            return next(specifier + extension, context);
          } catch {
            /* Try next known extension. */
          }
        }
      }
      throw error;
    }
  },
  load(url, context, next) {
    if (!/\.tsx?$/.test(url)) return next(url, context);
    return {
      format: 'module',
      shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
    };
  },
});
