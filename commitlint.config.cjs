/**
 * commitlint 配置 —— 基于 Angular 规范
 * 格式：<type>(<scope>): <subject>
 * 例：feat(canvas): 新增画布网格吸附功能
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type 枚举（Angular 规范）
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 Bug
        'docs',     // 文档
        'style',    // 代码格式（不影响功能：空格、分号等）
        'refactor', // 重构（既不是新功能也不是修复 Bug）
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建系统或外部依赖变更（Vite、npm）
        'ci',       // CI 配置变更
        'chore',    // 杂项：不修改 src 与 test 的其他变更
        'revert',   // 回滚
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
