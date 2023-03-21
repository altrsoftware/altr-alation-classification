import 'dotenv-defaults/config.js';
import MockAdapter from 'axios-mock-adapter';
import * as altr from '../api/altrApi.js';
import * as alation from '../api/alationApi.js';
import * as utils from '../utils.js';
require('dotenv').config();

describe('getAllCustomFields()', () => {
	const altrClassification = [{ id: 1, name: 'ALTR Classification' }];
	const altrConfidence = [{ id: 2, name: 'ALTR Classification Confidence' }];
	const altrReport = [{ id: 3, name: 'ALTR Classification Report' }];

	it('returns an array of three custom fields', async () => {
		const mockAlation = jest.spyOn(alation, 'getMultipleCustomFields');
		mockAlation.mockResolvedValueOnce(altrClassification);
		mockAlation.mockResolvedValueOnce(altrConfidence);
		mockAlation.mockResolvedValueOnce(altrReport);

		const [result1, result2, result3] = await utils.getAllCustomFields();

		expect(result1).toEqual(altrClassification);
		expect(result2).toEqual(altrConfidence);
		expect(result3).toEqual(altrReport);
	});

	it('throws an error if any of the custom fields do not exist', async () => {
		const mockAlation = jest.spyOn(alation, 'getMultipleCustomFields');
		mockAlation.mockResolvedValueOnce([]);
		mockAlation.mockResolvedValueOnce(altrConfidence);
		mockAlation.mockResolvedValueOnce(altrReport);

		await expect(utils.getAllCustomFields()).rejects.toThrow('Issue with necessary custom fields');
	});

	it('throws an error if there are duplicate custom fields', async () => {
		const altrClassification = [
			{ id: 1, name: 'ALTR Classification' },
			{ id: 2, name: 'ALTR Classification' },
		];
		const mockAlation = jest.spyOn(alation, 'getMultipleCustomFields');
		mockAlation.mockResolvedValueOnce(altrClassification);
		mockAlation.mockResolvedValueOnce(altrConfidence);
		mockAlation.mockResolvedValueOnce(altrReport);

		await expect(utils.getAllCustomFields()).rejects.toThrow('Issue with necessary custom fields');
	});
});

describe('getMatchingDatabases()', () => {
	const databasesOne = [
		{ id: 1, dbname: 'testdb' },
		{ id: 2, dbname: 'productiondb' },
		{ id: 3, dbname: 'stagingdb' },
	];

	const databasesTwo = [
		{ id: 1, dbname: 'TESTDB' },
		{ id: 2, dbname: 'devdb' },
		{ id: 3, dbname: 'stagingdb' },
	];

	it('returns an empty array when given empty arrays', () => {
		expect(utils.getMatchingDatabases([], [])).toEqual([]);
	});

	it('returns an empty array when no matching databases are found', () => {
		expect(utils.getMatchingDatabases(databasesOne, [{ dbname: 'nonexistentdb' }])).toEqual([]);
	});

	it('returns an array of matching databases when some matches are found', () => {
		expect(utils.getMatchingDatabases(databasesOne, databasesTwo)).toEqual([
			{ id: 1, dbname: 'testdb' },
			{ id: 3, dbname: 'stagingdb' },
		]);
	});

	it('returns an array of matching databases that is case-insensitive', () => {
		const databasesThree = [{ id: 1, dbname: 'TestDb' }];
		expect(utils.getMatchingDatabases(databasesOne, databasesThree)).toEqual([{ id: 1, dbname: 'testdb' }]);
	});
});

describe('getDatabaseNames()', () => {
	it('returns an array of database names', () => {
		const databases = [
			{ id: 1, dbname: 'db1' },
			{ id: 2, dbname: 'db2' },
			{ id: 3, dbname: 'db3' },
		];
		const result = utils.getDatabaseNames(databases);
		expect(result).toEqual(['db1', 'db2', 'db3']);
	});

	it('returns an empty array if passed an empty array', () => {
		const databases = [];
		const result = utils.getDatabaseNames(databases);
		expect(result).toEqual([]);
	});

	it('returns undefined if passed null or undefined', () => {
		let databases = null;
		let result = utils.getDatabaseNames(databases);
		expect(result).toEqual(undefined);

		databases = undefined;
		result = utils.getDatabaseNames(databases);
		expect(result).toEqual(undefined);
	});
});

describe('getClassificationData()', () => {
	it('returns empty Maps when no databases are passed', async () => {
		const { classifiers, totals } = await utils.getClassificationData([]);
		expect(classifiers.size).toBe(0);
		expect(totals.size).toBe(0);
	});

	it('returns expected Maps when databases are passed', async () => {
		let mockAltr = jest.spyOn(altr, 'getClassifiersOfDatabase');
		mockAltr.mockResolvedValueOnce({
			Classifications: [
				{ Type: 'PERSON_NAME', Amount: 44, Percent: 22.53 },
				{ Type: 'PHONE_NUMBER', Amount: 20, Percent: 10.26 },
			],
			Totals: {
				ClassifiedColumns: 200,
				TotalColumns: 600,
				PercentSuccesfullyClassified: 37.63,
			},
		});

		const expectedClassifiers = new Map();
		expectedClassifiers.set('db1', [
			{ Type: 'PERSON_NAME', Amount: 44, Percent: 22.53 },
			{ Type: 'PHONE_NUMBER', Amount: 20, Percent: 10.26 },
		]);

		const expectedTotals = new Map();
		expectedTotals.set('db1', {
			ClassifiedColumns: 200,
			TotalColumns: 600,
			PercentSuccesfullyClassified: 37.63,
		});

		const result = await utils.getClassificationData([{ dbname: 'db1', dbid: 1 }]);

		expect(result.classifiers).toEqual(expectedClassifiers);
		expect(result.totals).toEqual(expectedTotals);
	});
});

describe('getUniqueClassifierNames()', () => {
	it('returns an empty array for an empty map', () => {
		const classifiers = new Map();
		expect(utils.getUniqueClassifierNames(classifiers)).toEqual([]);
	});

	it('returns an array of unique classifier names', () => {
		const classifiers = new Map([
			[
				'key1',
				[
					{ Type: 'PERSON_NAME', Amount: 44, Percent: 22.53 },
					{ Type: 'PHONE_NUMBER', Amount: 20, Percent: 10.26 },
				],
			],
			[
				'key2',
				[
					{ Type: 'PERSON_NAME', Amount: 10, Percent: 5.13 },
					{ Type: 'EMAIL_ADDRESS', Amount: 5, Percent: 2.56 },
				],
			],
		]);
		expect(utils.getUniqueClassifierNames(classifiers)).toEqual(['PERSON_NAME', 'PHONE_NUMBER', 'EMAIL_ADDRESS']);
	});

	it('returns an array with only one unique classifier name if all classifiers have the same type', () => {
		const classifiers = new Map([
			[
				'key1',
				[
					{ Type: 'CITY', Amount: 10, Percent: 5.13 },
					{ Type: 'CITY', Amount: 5, Percent: 2.56 },
				],
			],
		]);
		expect(utils.getUniqueClassifierNames(classifiers)).toEqual(['CITY']);
	});
});

describe('getColumnsOfClassifiers()', () => {
	let mockAltr = jest.spyOn(altr, 'getColumnsOfClassifier');
	mockAltr.mockResolvedValueOnce([
		{
			clientDatabaseID: 1,
			database: 'COMPANY_DB',
			schema: 'PUBLIC',
			table: 'EMPLOYEES',
			column: 'EMAIL',
			classifier: ['EMAIL_ADDRESS'],
			confidence: 'LIKELY',
			fullyQualifiedTableName: 'PUBLIC.EMPLOYEES',
			alsoAppearsAs: ['EMAILS', 'FIRST_NAME'],
		},
	]);

	mockAltr.mockResolvedValueOnce([
		{
			clientDatabaseID: 1,
			database: 'COMPANY_DB',
			schema: 'PUBLIC',
			table: 'EMPLOYEES',
			column: 'EMAIL',
			classifier: ['FIRST_NAME'],
			confidence: 'LIKELY',
			fullyQualifiedTableName: 'PUBLIC.EMPLOYEES',
			alsoAppearsAs: ['EMAILS', 'EMAIL_ADDRESS'],
		},
	]);

	mockAltr.mockResolvedValueOnce([
		{
			clientDatabaseID: 1,
			database: 'COMPANY_DB',
			schema: 'PUBLIC',
			table: 'EMPLOYEES',
			column: 'EMAIL',
			classifier: ['EMAILS'],
			confidence: 'LIKELY',
			fullyQualifiedTableName: 'PUBLIC.EMPLOYEES',
			alsoAppearsAs: ['FIRST_NAME', 'EMAIL_ADDRESS'],
		},
	]);

	it('returns the correct columns map', async () => {
		const classifiers = ['EMAIL_ADDRESS', 'FIRST_NAME', 'EMAILS'];
		const altrClassifiedDatabases = [
			{ dbid: 1, dbname: 'db1' },
			{ dbid: 2, dbname: 'db2' },
			{ dbid: 3, dbname: 'db3' },
		];
		const expectedColumnsMap = new Map([
			['COMPANY_DB.PUBLIC.EMPLOYEES.EMAIL', ['EMAILS:LIKELY', 'FIRST_NAME:LIKELY', 'EMAIL_ADDRESS:LIKELY']],
		]);
		const columnsMap = await utils.getColumnsOfClassifiers(classifiers, altrClassifiedDatabases);
		expect(columnsMap).toEqual(expectedColumnsMap);
	});

	it('filters out columns that are not in operating databases', async () => {
		const classifiers = ['EMAIL_ADDRESS'];
		const altrClassifiedDatabases = [{ dbid: 5, dbname: 'db1' }];
		const expectedColumnsMap = new Map([]);
		const columnsMap = await utils.getColumnsOfClassifiers(classifiers, altrClassifiedDatabases);
		expect(columnsMap).toEqual(expectedColumnsMap);
	});
});

describe('getAlationSchemas()', () => {
	let mockAltr = jest.spyOn(alation, 'getSchemas');
	const alationDatabases = [{ name: 'db1', id: 10 }];

	it('returns the correct columns map', async () => {
		mockAltr.mockResolvedValueOnce([
			{
				id: 1,
				name: 'Employees',
				title: 'Schema for employees data.',
				ds_id: 10,
				key: '10.db1.employees',
			},
			{
				id: 2,
				name: 'Public',
				title: 'Schema for employees data.',
				ds_id: 10,
				key: '10.db1.public',
			},
		]);
		const expectedSchemaMap = new Map();
		expectedSchemaMap.set('DB1.EMPLOYEES', {
			id: 1,
			name: 'Employees',
			title: 'Schema for employees data.',
			ds_id: 10,
			key: '10.db1.employees',
		});

		expectedSchemaMap.set('DB1.PUBLIC', {
			id: 2,
			name: 'Public',
			title: 'Schema for employees data.',
			ds_id: 10,
			key: '10.db1.public',
		});

		const schemasMap = await utils.getAlationSchemas(alationDatabases);
		expect(schemasMap).toEqual(expectedSchemaMap);
	});

	it('skips INFORMATION_SCHEMA and ALTR_DSAAS schemas', async () => {
		mockAltr.mockResolvedValueOnce([
			{
				id: 1,
				name: 'Employees',
				ds_id: 10,
				key: '10.db1.employees',
			},
			{
				id: 2,
				name: 'Public',
				ds_id: 10,
				key: '10.db1.public',
			},
			{
				id: 3,
				name: 'altr_dsaas',
				ds_id: 10,
				key: '10.db1.altr_dsaas',
			},
			{
				id: 4,
				name: 'information_schema',
				ds_id: 10,
				key: '10.db1.information_schema',
			},
		]);
		const expectedSchemaMap = new Map();
		expectedSchemaMap.set('DB1.EMPLOYEES', {
			id: 1,
			name: 'Employees',
			ds_id: 10,
			key: '10.db1.employees',
		});

		expectedSchemaMap.set('DB1.PUBLIC', {
			id: 2,
			name: 'Public',
			ds_id: 10,
			key: '10.db1.public',
		});

		const schemasMap = await utils.getAlationSchemas(alationDatabases);
		expect(schemasMap).toEqual(expectedSchemaMap);
	});
});

describe('buildColumnMultiPickerUpdateObjects()', () => {
	it('returns an empty array when columns and customField are empty arrays', () => {
		const columns = [];
		const customField = [];
		const result = utils.buildColumnMultiPickerUpdateObjects(columns, customField);
		expect(result).toEqual([]);
	});

	it('returns an array with one object when columns has one item and customField has one item', () => {
		const columns = [
			{
				id: 10422,
				name: 'CONST_TRADE',
				ds_id: 34,
				key: '34.db1_1.public.all_data.const_trade',
				schema_id: 64,
				table_id: 748,
				table_name: 'db1_1.public.all_data',
				classifiers: ['LAST_NAME:POSSIBLE', 'LOCATION:POSSIBLE', 'ORGANIZATION_NAME:POSSIBLE', 'PERSON_NAME:POSSIBLE'],
			},
		];
		const customField = [
			{
				field_type: 'MULTI_PICKER',
				id: 10059,
				name_plural: 'ALTR Classifications',
				name_singular: 'ALTR Classification',
			},
		];
		const result = utils.buildColumnMultiPickerUpdateObjects(columns, customField);
		expect(result).toEqual([
			{
				value: ['LAST_NAME', 'LOCATION', 'ORGANIZATION_NAME', 'PERSON_NAME'],
				oid: 10422,
				otype: 'attribute',
				ts_updated: expect.any(String),
				field_id: 10059,
			},
		]);
	});
});

describe('buildColumnRichTextUpdateObjects()', () => {
	const columns = [
		{
			id: 10422,
			name: 'CONST_TRADE',
			ds_id: 34,
			key: '34.db1.public.all_data.const_trade',
			schema_id: 64,
			table_id: 748,
			table_name: 'db1.public.all_data',
			classifiers: ['LAST_NAME:POSSIBLE', 'LOCATION:POSSIBLE'],
		},
		{
			id: 10474,
			name: 'ADDRESS1',
			ds_id: 34,
			key: '34.db1.public.all_data.address1',
			schema_id: 64,
			table_id: 748,
			table_name: 'db1.public.all_data',
			classifiers: ['FEMALE_NAME:POSSIBLE', 'FIRST_NAME:POSSIBLE'],
		},
	];

	const customField = [
		{
			field_type: 'MULTI_PICKER',
			id: 10059,
			name_plural: 'ALTR Classifications',
			name_singular: 'ALTR Classification',
		},
	];

	test('should return an array of objects', () => {
		const result = utils.buildColumnRichTextUpdateObjects(columns, customField);
		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBe(columns.length);
	});

	test('should return the correct object structure for each column', () => {
		const result = utils.buildColumnRichTextUpdateObjects(columns, customField);
		const expectedObject = {
			value: expect.any(String),
			oid: expect.any(Number),
			otype: expect.any(String),
			ts_updated: expect.any(String),
			field_id: expect.any(Number),
		};
		result.forEach((object) => {
			expect(object).toEqual(expect.objectContaining(expectedObject));
		});
	});

	test('should return an empty array if there are no columns', () => {
		const columns = [];
		const customField = [
			{
				field_type: 'MULTI_PICKER',
				id: 10059,
				name_plural: 'ALTR Classifications',
				name_singular: 'ALTR Classification',
			},
		];
		const result = utils.buildColumnRichTextUpdateObjects(columns, customField);
		expect(result).toBeInstanceOf(Array);
		expect(result).toEqual([]);
	});
});

describe('buildClassificationConfidenceRichText()', () => {
	it('should return the correct HTML table for a single classifier', () => {
		const classifiers = ['EMAIL_ADDRESS:LIKELY'];
		const expectedHTML = `<div><div><table><thead><tr><th>CLASSIFIER</th><th>CONFIDENCE SCORE</th></tr></thead><tbody><tr><td>EMAIL_ADDRESS</td><td >LIKELY</td></tr></tbody></table><p><br></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers of the column and the confidence score for each classifier.</em></p><p><em>Possible scores are: VERY LIKELY, LIKELY, POSSIBLE, NA (Not Applicable)</em></p></div></div>`;
		const result = utils.buildClassificationConfidenceRichText(classifiers);
		expect(result).toBe(expectedHTML);
	});
});

describe('buildClassificationReportRichText()', () => {
	it('should return the correct HTML table', () => {
		const classifiers = [{ Type: 'EMAIL_ADDRESS', Percent: 100, Amount: 10 }];
		const totals = { ClassifiedColumns: 10, TotalColumns: 20, PercentSuccesfullyClassified: 50 };
		const expectedHTML = `<div><div><table style=width: 100%;><thead><tr><th>CLASSIFIER</th><th>% OF COLUMNS OF TOTAL CLASSIFIED COLUMNS</th><th># OF COLUMNS</th></tr></thead><tbody><tr><td>${classifiers[0].Type}</td><td>${classifiers[0].Percent}%</td><td>${classifiers[0].Amount}</td></tr></tbody></table><p><br></p><p><strong>${totals.ClassifiedColumns} of the ${totals.TotalColumns} total columns were classified. (${totals.PercentSuccesfullyClassified}%)</strong></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers found in the database and the percentage of columns under said classifiers.</em></p></div></div>`;
		const result = utils.buildClassificationReportRichText(classifiers, totals);
		expect(result).toBe(expectedHTML);
	});
});
