// commitlint.config.js

/** @type {import('@commitlint/types').UserConfig} */
export default {
  // Base rules from Conventional Commits
  extends: ['@commitlint/config-conventional'],

  /*
   * Strong but friendly ruleset:
   * - header max 72 chars (classic)
   * - subject without ending period and in sentence-case
   * - kebab-case scopes, allow multiple scopes via prompt
   */
  rules: {
    'header-max-length': [2, 'always', 72],
    'header-trim': [2, 'always'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'always', ['sentence-case', 'lower-case']], // allow sentence or lower
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'wip',
      ],
    ],
    'scope-case': [2, 'always', ['kebab-case']],
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
  parserPreset: 'conventional-changelog-conventionalcommits',

  prompt: {
    settings: {
      enableMultipleScopes: true,
      scopeEnumSeparator: ',',
    },
    messages: {
      skip: ':skip',
      max: 'upper %d chars',
      min: '%d chars at least',
      emptyWarning: 'can not be empty',
      upperLimitWarning: 'over limit',
      lowerLimitWarning: 'below limit',
    },
    questions: {
      type: {
        description: "Select the type of change you're committing:",
        enum: {
          feat: { description: 'A new feature', title: 'Features', emoji: '✨' },
          fix: { description: 'A bug fix', title: 'Bug Fixes', emoji: '🐛' },
          docs: { description: 'Documentation only changes', title: 'Docs', emoji: '📚' },
          style: {
            description: 'Code style updates (formatting, whitespaces, etc) with no code meaning changes',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'Code change that neither fixes a bug nor adds a feature',
            title: 'Refactoring',
            emoji: '🧹',
          },
          perf: { description: 'Performance improvements', title: 'Performance', emoji: '🚀' },
          test: { description: 'Adding or correcting tests', title: 'Tests', emoji: '🧪' },
          build: {
            description: 'Build system or external dependencies',
            title: 'Build',
            emoji: '🛠️',
          },
          ci: {
            description: 'CI config & scripts',
            title: 'CI',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '🧩',
          },
          revert: { description: 'Revert a previous commit', title: 'Reverts', emoji: '⏪' },
        },
      },
      scope: {
        description: 'What is the scope of this change? (e.g. ui, api, mobile)',
      },
      subject: {
        description: 'Write a short, imperative sentence describing the change',
      },
      body: {
        description: 'Provide a longer description (wrap at ~100 chars per line)',
      },
      isBreaking: { description: 'Are there any breaking changes?' },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please describe the change in detail',
      },
      breaking: { description: 'Describe the breaking changes' },
      isIssueAffected: { description: 'Does this change affect any open issues?' },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please describe the context',
      },
      issues: { description: 'Add issue references (e.g. "fix #123", "re #456")' },
    },
  },
}