import { defaults } from 'jest-config';

export default {
	transform: {
		'^.+\\.jsx?$': 'babel-jest',
	},
	testMatch: [...defaults.testMatch, '**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
	transformIgnorePatterns: ['/node_modules/(?!p-throttle)/'],
	testEnvironment: 'node',
};
