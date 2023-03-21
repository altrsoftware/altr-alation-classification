import 'dotenv-defaults/config.js';
import MockAdapter from 'axios-mock-adapter';
import * as altr from '../api/altrApi.js';

let mockAxios;

beforeAll(() => {
	mockAxios = new MockAdapter(altr.altrAxios);
});

afterEach(() => {
	mockAxios.reset();
});

describe(`getAdministrators()`, () => {
	it(`should return true`, async () => {
		mockAxios.onGet(`/administrators`).reply(200);

		const result = await altr.getAdministrators();

		expect(result).toEqual(true);
	});

	it(`should return false if the API returns an error`, async () => {
		mockAxios.onGet(`/administrators`).reply(500);

		const result = await altr.getAdministrators();

		expect(result).toEqual(false);
	});
});

describe(`getClassifiedDatabases()`, () => {
	it(`should return an array of databases`, async () => {
		const expectedData = {
			data: [
				{
					dbid: 1,
					dbfriendlyname: 'My Database',
					dbname: 'EMPLOYEES',
					classified: true,
				},
			],
			success: true,
		};
		mockAxios.onGet(`/classification/databases/?classificationCompleted=true`).reply(200, expectedData);

		const result = await altr.getClassifiedDatabases();

		expect(result).toEqual(expectedData.data);
	});

	it(`should return false if the API returns an error`, async () => {
		mockAxios.onGet(`/classification/databases/?classificationCompleted=true`).reply(500);

		await expect(altr.getClassifiedDatabases()).rejects.toThrow();
	});
});

describe(`getClassifiersOfDatabase()`, () => {
	it(`should return an array of classifiers and 'Totals' Object`, async () => {
		const expectedData = {
			data: {
				Classifications: [
					{
						Type: 'PERSON_NAME',
						Amount: 44,
						Percent: 22.53,
					},
				],
				Totals: {
					ClassifiedColumns: 200,
					TotalColumns: 600,
					PercentSuccesfullyClassified: 37.63,
				},
			},
			success: true,
		};
		mockAxios.onGet(`/classification/classifiers/${1}`).reply(200, expectedData);

		const result = await altr.getClassifiersOfDatabase(1);

		expect(result).toEqual(expectedData.data);
	});

	it(`should return false if the API returns an error`, async () => {
		mockAxios.onGet(`/classification/classifiers/${1}`).reply(500);

		await expect(altr.getClassifiersOfDatabase(1)).rejects.toThrow();
	});
});

describe(`getColumnsOfClassifier()`, () => {
	it(`should return an array of columns`, async () => {
		const expectedData = {
			data: [
				{
					clientDatabaseID: 1,
					databaseTypeName: 'SNOWFLAKEDB_EXTERNAL_FUNCTIONS',
					databaseTypeID: 9,
					database: 'COMPANY_DB',
					schema: 'PUBLIC',
					table: 'EMPLOYEES',
					column: 'EMAIL',
					classifier: ['FIRST_NAME'],
					isGovernable: 0,
					isScatterable: false,
					dataType: 'VARCHAR',
					confidence: 'LIKELY',
					fullyQualifiedTableName: 'PUBLIC.EMPLOYEES',
					alsoAppearsAs: ['EMAILS', 'EMAIL_ADDRESS'],
					dataState: 'REGISTERED',
				},
			],
			success: true,
		};
		mockAxios.onGet(`/classification/columns/${`classifier`}?offset=${0}&limit=50`).reply(200, expectedData);

		const result = await altr.getColumnsOfClassifier(`classifier`, 0);

		expect(result).toEqual(expectedData.data);
	});

	it(`should return false if the API returns an error`, async () => {
		mockAxios.onGet(`/classification/columns/${`classifier`}?offset=${0}&limit=50`).reply(500);

		await expect(altr.getColumnsOfClassifier(`classifier`, 0)).rejects.toThrow();
	});
});
