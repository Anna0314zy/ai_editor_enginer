/**
 * ESLint Flat Config (ESLint 9+)
 * 支持：TypeScript + React 18 + React Hooks + Prettier + 最新 ES 语法
 *
 * 说明：
 * - flat config 用 `ignores` 替代 .eslintignore
 * - 规则放在对应的 config 对象里，按顺序合并
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 1. 全局忽略
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.qoder/**',
      '.github/**',
      '**/*.min.js',
      '**/*.d.ts',
      'vite.config.ts',
      'pnpm-lock.yaml',
      'package-lock.json',
    ],
  },

  // 2. JS / TS 推荐规则
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. 项目通用配置
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
    },
    rules: {
      // React 推荐规则（flat config 下手动展开）
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // Prettier 作为 ESLint 规则执行
      'prettier/prettier': 'error',

      // React
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',

      // 通用
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
    },
  },

  // 4. 放最后：关闭所有和 Prettier 冲突的样式类规则
  prettierConfig,
);
