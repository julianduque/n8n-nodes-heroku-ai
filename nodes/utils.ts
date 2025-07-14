import type { INodeProperties } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export function getConnectionHintNoticeField(inputTypes: NodeConnectionType[]): INodeProperties {
	const connectionHints = inputTypes
		.map((type) => {
			switch (type) {
				case NodeConnectionType.AiAgent:
					return 'AI Agent';
				case NodeConnectionType.AiChain:
					return 'AI Chain';
				case NodeConnectionType.AiTool:
					return 'AI Tool';
				case NodeConnectionType.AiTextSplitter:
					return 'AI Text Splitter';
				case NodeConnectionType.AiVectorStore:
					return 'AI Vector Store';
				case NodeConnectionType.AiMemory:
					return 'AI Memory';
				case NodeConnectionType.AiOutputParser:
					return 'AI Output Parser';
				case NodeConnectionType.AiRetriever:
					return 'AI Retriever';
				case NodeConnectionType.AiEmbedding:
					return 'AI Embedding';
				case NodeConnectionType.AiLanguageModel:
					return 'AI Language Model';
				default:
					return type;
			}
		})
		.join(', ');

	return {
		displayName: '',
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				'@version': [1],
			},
		},
		typeOptions: {
			theme: 'info',
		},
		description: `This node connects to: ${connectionHints}. To use it, connect it to one of those node types.`,
	};
}
