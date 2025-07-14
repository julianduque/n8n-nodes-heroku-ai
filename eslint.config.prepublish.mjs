import baseConfig from './eslint.config.js';

export default [
	...baseConfig,
	{
		files: ['package.json'],
		plugins: {
			'n8n-nodes-base': baseConfig.find(config => config.files?.includes('package.json'))?.plugins?.['n8n-nodes-base']
		},
		rules: {
			'n8n-nodes-base/community-package-json-name-still-default': 'error',
		}
	}
];