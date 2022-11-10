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

describe('TESTING getClassifiedDbs()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/databases/?classificationCompleted=true`);

	describe('When the call is successful', () => {
		it('Shall return an array of databases', async () => {
			const expected = [{
				"dbid": 0,
				"friendlyDatabaseName": "string",
				"classified": true
			}, {
				"dbid": 1,
				"friendlyDatabaseName": "string",
				"classified": true
			}];

			mock.onGet(url).reply(200, expected);

			const result = await altr.getClassifiedDbs(process.env.ALTR_DOMAIN);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await altr.getClassifiedDbs(process.env.ALTR_DOMAIN);
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getDb()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/databases/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an object', async () => {
			const expected = {
				"id": 0,
				"friendlyDatabaseName": "string",
				"maxNumberOfConnections": 0,
				"maxNumberOfBatches": 0,
				"databasePort": 0,
				"databaseUsername": "string",
				"databaseType": "sqlserver",
				"databaseName": "string",
				"hostname": "string",
				"connectionString": true,
				"clientId": "string",
				"snowflakeRole": "string",
				"warehouseName": "string",
				"SFCount": 0,
				"dataUsageHistory": true,
				"classificationStarted": true
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
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getClassifiersOfDb()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/classifiers/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an object', async () => {
			const expected = {
				"Classifications": [
					{
						"Type": "string",
						"Amount": 0,
						"Percent": 0
					}
				],
				"Totals": {
					"ClassifiedColumns": 0,
					"TotalColumns": 0,
					"PercentSuccesfullyClassified": 0
				}
			};

			mock.onGet(url).reply(200, expected);

			const result = await altr.getClassifiersOfDb(process.env.ALTR_DOMAIN, '', 0);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const expectedError = async () => {
				await altr.getClassifiersOfDb(process.env.ALTR_DOMAIN, '', 0);
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getColumnsOfClassifierOfDb()', () => {
	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/columns/${'TEST'}/${0}`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = [
				{
					"clientDatabaseID": 0,
					"databaseTypeName": 0,
					"databaseTypeID": 0,
					"database": "string",
					"schema": "string",
					"table": "string",
					"column": "string",
					"classifier": [
						"string"
					],
					"isGovernable": 0,
					"isScatterable": 0,
					"dataType": "string",
					"dataState": "REGISTERED"
				}
			];

			mock.onGet(url).reply(200, expected);

			const result = await altr.getColumnsOfClassifierOfDb(process.env.ALTR_DOMAIN, '', 'TEST', 0);

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const expectedError = async () => {
				await altr.getColumnsOfClassifierOfDb(process.env.ALTR_DOMAIN, '', 'TEST', 0);
			}

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