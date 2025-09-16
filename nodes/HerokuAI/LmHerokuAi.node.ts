import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	INodeListSearchResult,
	INodeListSearchItems,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { ChatHeroku } from 'heroku-langchain';
import { getConnectionHintNoticeField } from '../utils';

export class LmHerokuAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Heroku AI Chat Model',
		name: 'lmHerokuAi',
		icon: { light: 'file:herokuAi.svg', dark: 'file:herokuAi.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["model"]}}',
		description: 'Language Model for Heroku AI (Managed Inference and Agents)',
		defaults: {
			name: 'Heroku AI Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://devcenter.heroku.com/articles/heroku-inference-api-v1-chat-completions',
					},
				],
			},
		},
		credentials: [
			{
				name: 'herokuAIApi',
				required: true,
			},
		],
		inputs: [],
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiAgent, NodeConnectionType.AiChain]),
			{
				displayName: 'Model',
				name: 'model',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'claude-3-5-sonnet-latest' },
				required: true,
				description:
					'The model which will generate the completion. <a href="https://devcenter.heroku.com/articles/heroku-inference-api-v1-chat-completions">Learn more</a>.',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a model...',
						typeOptions: {
							searchListMethod: 'searchModels',
							searchable: true,
						},
					},
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						placeholder: 'claude-3-5-sonnet-latest',
					},
				],
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: {
					numberPrecision: 1,
					minValue: 0,
					maxValue: 1,
				},
				default: 0.7,
				description:
					'Controls randomness in the response. Lower values make output more focused and deterministic.',
			},
			{
				displayName: 'Maximum Tokens',
				name: 'maxTokens',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 8192,
				},
				default: 1024,
				description: 'The maximum number of tokens to generate in the completion',
			},
			{
				displayName: 'Frequency Penalty',
				name: 'frequencyPenalty',
				type: 'number',
				typeOptions: {
					numberPrecision: 1,
					minValue: -2,
					maxValue: 2,
				},
				default: 0,
				description: 'Penalty for repeated tokens. Higher values reduce repetition.',
			},
			{
				displayName: 'Presence Penalty',
				name: 'presencePenalty',
				type: 'number',
				typeOptions: {
					numberPrecision: 1,
					minValue: -2,
					maxValue: 2,
				},
				default: 0,
				description:
					'Penalty for using tokens that have already appeared. Higher values encourage new topics.',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
					minValue: 0,
					maxValue: 1,
				},
				default: 1,
				description:
					'Nucleus sampling parameter. Consider only tokens with top P probability mass.',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options for the Heroku AI model',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Streaming',
						name: 'streaming',
						type: 'boolean',
						default: false,
						description: 'Whether to stream the response as it is generated',
					},
					{
						displayName: 'Extended Thinking',
						name: 'extendedThinking',
						type: 'boolean',
						default: false,
						description: 'Whether to enable extended reasoning mode for more thorough analysis',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 60000,
						description: 'Request timeout in milliseconds',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			getModels: async function (this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('herokuAIApi');
				const baseUrl = credentials.baseUrl as string;
				const apiKey = credentials.apiKey as string;

				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/available-models`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
					});

					const models = response || [];
					const chatModels = models.filter(
						(model: any) => model.type && model.type.includes('text-to-text'),
					);

					return chatModels
						.map((model: any) => ({
							name: model.model_id,
							value: model.model_id,
						}))
						.sort((a: any, b: any) => a.name.localeCompare(b.name));
				} catch (error) {
					return [
						{ name: 'claude-3-5-sonnet-latest', value: 'claude-3-5-sonnet-latest' },
						{ name: 'claude-3-5-haiku', value: 'claude-3-5-haiku' },
						{ name: 'claude-3-7-sonnet', value: 'claude-3-7-sonnet' },
						{ name: 'claude-4-sonnet', value: 'claude-4-sonnet' },
						{ name: 'gpt-oss-12b', value: 'gpt-oss-12b' },
						{ name: 'nova-lite', value: 'nova-lite' },
						{ name: 'nova-pro', value: 'nova-pro' },
					];
				}
			},
		},
		listSearch: {
			searchModels: async function (
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('herokuAIApi');
				const baseUrl = credentials.baseUrl as string;
				const apiKey = credentials.apiKey as string;

				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/available-models`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
					});

					const models = response || [];

					// Filter for text-to-text models (chat models)
					const chatModels = models.filter(
						(model: any) => model.type && model.type.includes('text-to-text'),
					);

					// Apply search filter if provided
					const filteredModels = filter
						? chatModels.filter((model: any) =>
								model.model_id.toLowerCase().includes(filter.toLowerCase()),
							)
						: chatModels;

					const results: INodeListSearchItems[] = filteredModels.map((model: any) => ({
						name: model.model_id,
						value: model.model_id,
					}));

					// Sort alphabetically
					results.sort((a, b) => a.name.localeCompare(b.name));

					return { results };
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to fetch models: ${error.message}`);
				}
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('herokuAIApi');

		const model = this.getNodeParameter('model', itemIndex) as { mode: string; value: string };
		const modelName = model.value;

		const temperature = this.getNodeParameter('temperature', itemIndex) as number;
		const maxTokens = this.getNodeParameter('maxTokens', itemIndex) as number;
		const topP = this.getNodeParameter('topP', itemIndex) as number;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			streaming?: boolean;
			extendedThinking?: boolean;
			timeout?: number;
		};

		const herokuAi = new ChatHeroku({
			model: modelName,
			temperature,
			maxTokens,
			topP,
			streaming: options.streaming,
			apiKey: credentials.apiKey as string,
			apiUrl: credentials.baseUrl as string,
			...(options.timeout && { timeout: options.timeout }),
		});

		return {
			response: herokuAi,
		};
	}
}
