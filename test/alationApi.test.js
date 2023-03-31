import 'dotenv-defaults/config.js';
import MockAdapter from 'axios-mock-adapter';
import * as alation from '../api/alationApi.js';

let mockAxios;
beforeAll(() => {
	mockAxios = new MockAdapter(alation.alationAxios);
});

afterEach(() => {
	mockAxios.reset();
});

describe(`getUsers()`, () => {
	it(`should return true`, async () => {
		mockAxios.onGet(`/v1/user/?email=${process.env.ALATION_EMAIL}&limit=100&skip=0`).reply(200);

		const result = await alation.getUsers();

		expect(result).toEqual(true);
	});

	it(`should return false if the API returns an error`, async () => {
		mockAxios.onGet(`/v1/user/?email=${process.env.ALATION_EMAIL}&limit=100&skip=0`).reply(500);

		const result = await alation.getUsers();

		expect(result).toEqual(false);
	});
});

describe(`getDatabases()`, () => {
	it(`should return an array of databases`, async () => {
		const expectedData = [
			{ id: 1, name: `db1` },
			{ id: 2, name: `db2` },
		];
		mockAxios.onGet(`/v1/datasource/?include_undeployed=false&include_hidden=true`).reply(200, expectedData);

		const result = await alation.getDatabases();

		expect(result).toEqual(expectedData);
	});

	it(`should throw an error if the API returns an error`, async () => {
		mockAxios.onGet(`/v1/datasource/?include_undeployed=false&include_hidden=true`).reply(500);

		await expect(alation.getDatabases()).rejects.toThrow();
	});
});

describe(`getMultipleCustomFields()`, () => {
	it(`should return an array of custom fields`, async () => {
		const expectedData = [
			{
				id: 0,
				name_plural: 'name0',
				name_singular: 'name0',
			},
			{
				id: 1,
				name_plural: 'name1',
				name_singular: 'name1',
			},
		];
		mockAxios
			.onGet(`/v2/custom_field/?field_type=${`field_type`}&name_singular=${`name_singular`}`)
			.reply(200, expectedData);

		const result = await alation.getMultipleCustomFields(`field_type`, `name_singular`);

		expect(result).toEqual(expectedData);
	});

	it(`should throw an error if the API returns an error`, async () => {
		mockAxios.onGet(`/v2/custom_field/?field_type=${`field_type`}&name_singular=${`name_singular`}`).reply(500);

		await expect(alation.getMultipleCustomFields()).rejects.toThrow();
	});
});

describe(`getSchemas()`, () => {
	it(`should return an array of schemas`, async () => {
		const expectedData = [
			{
				id: 0,
				name: 'Employees',
			},
			{
				id: 1,
				name: 'Public',
			},
		];
		mockAxios.onGet(`/v2/schema/?ds_id=${1}`).reply(200, expectedData);

		const result = await alation.getSchemas(1);

		expect(result).toEqual(expectedData);
	});

	it(`should throw an error if the API returns an error`, async () => {
		mockAxios.onGet(`/v2/schema/?ds_id=${1}`).reply(500);

		await expect(alation.getSchemas(1)).rejects.toThrow();
	});
});

describe(`getColumns()`, () => {
	it(`should return an array of columns`, async () => {
		const expectedData = [
			{
				id: 0,
				name: 'ID',
			},
			{
				id: 1,
				name: 'Email',
			},
		];
		mockAxios
			.onGet(`/v2/column/?ds_id=${1}&schema_id=${1}&table_name=${`tableName`}&name=${`columnName`}`)
			.reply(200, expectedData);

		const result = await alation.getColumns(1, 1, `tableName`, `columnName`);

		expect(result).toEqual(expectedData);
	});

	it(`should throw an error if the API returns an error`, async () => {
		mockAxios.onGet(`/v2/schema/?ds_id=${1}`).reply(500);

		await expect(alation.getColumns(1, 1, `tableName`, `columnName`)).rejects.toThrow();
	});
});

describe(`updateMultipleCustomFieldValues()`, () => {
	it(`should return an object`, async () => {
		const expectedData = {
			new_field_values: 1,
			updated_field_values: 0,
			field_values_received: 1,
		};
		mockAxios.onPut(`/v2/custom_field_value/`).reply(200, expectedData);

		const inputData = [
			{
				field_id: 1,
				ts_updated: '1',
				otype: 'data',
				oid: '1',
				value: ['value1', 'value2'],
			},
		];
		const result = await alation.updateMultipleCustomFieldValues(inputData);

		expect(result).toEqual(expectedData);
	});

	it(`should throw an error if the API returns an error`, async () => {
		mockAxios.onGet(`/v2/custom_field_value/`).reply(500);

		await expect(alation.updateMultipleCustomFieldValues()).rejects.toThrow();
	});
});
