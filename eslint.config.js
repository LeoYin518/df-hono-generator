import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'test/no-import-node-test': 'off',
    'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
  },
})
