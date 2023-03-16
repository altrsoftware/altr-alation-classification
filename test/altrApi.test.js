const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const altr = require('../api/altrApi.js');
require('dotenv').config();

let mock;

beforeAll(() => {
	mock = new MockAdapter(axios);
});

afterEach(() => {
	mock.reset();
});

describe('TESTING getClassifiedDatabases()', () => {
	const url = encodeURI(
		`https://${process.env.ALTR_DOMAIN}/api/classification/databases/?classificationCompleted=true`
	);

	describe('When the call is successful', () => {
		it('Shall return an array of databases', async () => {
			const expected = {
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

			mock.onGet(url).reply(200, expected);

			const result = await altr.getClassifiedDatabases(process.env.ALTR_DOMAIN, null);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected.data);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await altr.getClassifiedDatabases(process.env.ALTR_DOMAIN);
			};

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getDb()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/databases/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an object', async () => {
			const expected = {
				id: 0,
				friendlyDatabaseName: 'string',
				maxNumberOfConnections: 0,
				maxNumberOfBatches: 0,
				databasePort: 0,
				databaseUsername: 'string',
				databaseType: 'sqlserver',
				databaseName: 'string',
				hostname: 'string',
				connectionString: true,
				clientId: 'string',
				snowflakeRole: 'string',
				warehouseName: 'string',
				SFCount: 0,
				dataUsageHistory: true,
				classificationStarted: true,
			};

			mock.onGet(url).reply(200, expected);

			const result = await altr.getDb(process.env.ALTR_DOMAIN, '', 0);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const expectedError = async () => {
				await altr.getDb(process.env.ALTR_DOMAIN);
			};

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getClassifiersOfDatabase()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/classifiers/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an object', async () => {
			const expected = {
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

			mock.onGet(url).reply(200, expected);

			const result = await altr.getClassifiersOfDatabase(process.env.ALTR_DOMAIN, '', 0);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected.data);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const expectedError = async () => {
				await altr.getClassifiersOfDatabase(process.env.ALTR_DOMAIN, '', 0);
			};

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getColumnsOfClassifierOfDatabase()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/columns/${'TEST'}/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = {
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

			mock.onGet(url).reply(200, expected);

			const result = await altr.getColumnsOfClassifierOfDatabase(process.env.ALTR_DOMAIN, '', 'TEST', 0);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected.data);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const expectedError = async () => {
				await altr.getColumnsOfClassifierOfDatabase(process.env.ALTR_DOMAIN, '', 'TEST', 0);
			};

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getAdministrators()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/administrators`);

	describe('When the call is successful', () => {
		it('Shall return true', async () => {
			const expected = true;

			mock.onGet(url).reply(200, expected);

			const result = await altr.getAdministrators(process.env.ALTR_DOMAIN, '');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall return false', async () => {
			const expected = false;

			mock.onGet(url).reply(400, expected);

			const result = await altr.getAdministrators(process.env.ALTR_DOMAIN, '');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});
});
