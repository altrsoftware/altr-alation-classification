const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const alation = require('../api/alationApi.js');
require('dotenv').config();

let mock;

beforeAll(() => {
	mock = new MockAdapter(axios);
});

afterEach(() => {
	mock.reset();
});

describe('TESTING putMultipleCustomFieldValues', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v2/custom_field_value/`);

	describe('When the call is successful', () => {
		it('Shall return an object', async () => {
			const expected = {
				"new_field_values": 1,
				"updated_field_values": 0,
				"field_values_received": 1
			};

			mock.onPut(url).reply(200, expected);

			const result = await alation.putMultipleCustomFieldValues(process.env.ALATION_DOMAIN, '', [{ "field_id": 1, "otype": "test", "oid": "1", "value": ["test"] }]);

			expect(mock.history.put[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await alation.putMultipleCustomFieldValues(process.env.ALATION_DOMAIN, '', [{ "field_id": 1, "otype": "test", "oid": "1", "value": ["test"] }]);
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getMultipleCustomFields()', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v2/custom_field/?field_type=${'MULTI-PICKER'}&name_plural=${'Test'}`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = [
				{
					"field_type": "DATE",
					"id": 0,
					"name_plural": "string",
					"name_singular": "string",
				}
			];

			mock.onGet(url).reply(200, expected);

			const result = await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, '', 'MULTI-PICKER', 'Test');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, '', 'MULTI-PICKER', 'Test');
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getDatabases()', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v1/datasource/?include_undeployed=false&include_hidden=true`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = [
				{
					"dbtype": "mysql",
					"host": "10.11.21.125",
					"port": 3306,
					"uri": "mysql://<hostname>:<port>/<db_name>",
					"dbname": "sample_dbname",
					"db_username": "alation",
					"title": "test_mysql",
					"description": "Sample mysql datasource setup",
					"deployment_setup_complete": true,
					"private": false,
					"is_virtual": false,
					"is_hidden": false,
					"id": 0,
					// more...
				}
			];

			mock.onGet(url).reply(200, expected);

			const result = await alation.getDatabases(process.env.ALATION_DOMAIN, '');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await alation.getDatabases(process.env.ALATION_DOMAIN, '');
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getSchemas()', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v2/schema/`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = [{}];

			mock.onGet(url).reply(200, expected);

			const result = await alation.getSchemas(process.env.ALATION_DOMAIN, '');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await alation.getSchemas(process.env.ALATION_DOMAIN, '');
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getColumn()', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v2/column/?name=${'test'}&table_name=${'test'}&schema_id=${0}&ds_id=${0}`);

	describe('When the call is successful', () => {
		it('Shall return an array of objects', async () => {
			const expected = [{}];

			mock.onGet(url).reply(200, expected);

			const result = await alation.getColumn(process.env.ALATION_DOMAIN, '', 0, 0, 'test', 'test');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall retry and throw an error', async () => {
			const expectedError = async () => {
				await alation.getColumn(process.env.ALATION_DOMAIN, '', 0, 0, 'test', 'test');
			}

			await expect(expectedError()).rejects.toThrowError();
		});
	});
});

describe('TESTING getUsers', () => {
	const url = encodeURI(`https://${process.env.ALATION_DOMAIN}/integration/v1/user/?email=${'test@email.com'}&limit=100&skip=0`);

	describe('When the call is successful', () => {
		it('Shall return true', async () => {
			const expected = true;

			mock.onGet(url).reply(200, expected);

			const result = await alation.getUsers(process.env.ALATION_DOMAIN, '', 'test@email.com');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});

	describe('When the call is unsuccessful', () => {
		it('Shall return false', async () => {
			const expected = false;

			mock.onGet(url).reply(400, expected);

			const result = await alation.getUsers(process.env.ALATION_DOMAIN, '', 'test@email.com');

			expect(mock.history.get[0].url).toEqual(url);
			expect(result).toEqual(expected);
		});
	});
});