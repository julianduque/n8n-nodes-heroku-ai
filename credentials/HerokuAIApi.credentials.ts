import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class HerokuAIApi implements ICredentialType {
	name = 'herokuAIApi';
	displayName = 'Heroku AI API';
	documentationUrl =
		'https://devcenter.heroku.com/articles/heroku-inference-api-v1-chat-completions';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The Heroku Managed Inference API key (INFERENCE_KEY)',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://us.inference.heroku.com',
			description: 'The base URL for Heroku AI API. Default is US region.',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{ $credentials.apiKey }}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/available-models',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: 'Connection successful! Available models retrieved.',
					key: 'data',
					value: 'array',
				},
			},
		],
	};
}
