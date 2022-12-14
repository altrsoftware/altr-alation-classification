const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const altr = require('../api/altrApi.js');
const alation = require('../api/alationApi');
const utils = require('../utils.js');
require('dotenv').config();

let mock;

beforeAll(() => {
	mock = new MockAdapter(axios);
});

afterEach(() => {
	mock.reset();
});

// FILTERCLASSIFIEDDBS()
describe('TESTING filterClassifiedDbs(classifiedAltrDbs, alationDbs)', () => {

	describe('When classifiedAltrDbs matches alationDbs', () => {
		it('Shall return the same classifiedAltrDbs', () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];

			const alationDbs = [
				{
					"dbtype": "snowflake",
					"dbname": "db_1",
					"db_username": "alation",
					"title": "test_mysql",
					"description": "Sample mysql datasource setup",
					"deployment_setup_complete": true,
					"private": false,
					"is_virtual": false,
					"is_hidden": false,
					"id": 0,
				}
			];

			const expected = classifiedAltrDbs;
			const result = utils.filterClassifiedDbs(classifiedAltrDbs, alationDbs);

			expect(result).toStrictEqual(expected);
		});
	});

	describe('When classifiedAltrDbs has databases that are not in alationDbs', () => {
		it('Shall filter out databases that are not in alationDbs and return those that are', () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				},
				{
					"dbid": 0,
					"dbfriendlyname": "db_2",
					"classified": true,
					"dbname": "db_2"
				}
			];

			const alationDbs = [
				{
					"dbtype": "snowflake",
					"dbname": "db_1",
					"title": "test_mysql",
					"id": 0,
				}
			];

			const expected = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];
			const result = utils.filterClassifiedDbs(classifiedAltrDbs, alationDbs);

			expect(result).toStrictEqual(expected);
		});
	});

	describe('When alationDbs has databases that are not in classifiedAltrDbs', () => {
		it('Shall return databases that are in both', () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];

			const alationDbs = [
				{
					"dbtype": "snowflake",
					"dbname": "db_1",
					"title": "test_mysql",
					"id": 0,
				},
				{
					"dbtype": "snowflake",
					"dbname": "db_2",
					"title": "test_mysql",
					"id": 0,
				}
			];

			const expected = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];
			const result = utils.filterClassifiedDbs(classifiedAltrDbs, alationDbs);

			expect(result).toStrictEqual(expected);
		});
	});

	describe('When classifiedAltrDbs and alationDbs have no matching databases', () => {
		it('Shall throw an error', () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];

			const alationDbs = [
				{
					"dbtype": "snowflake",
					"dbname": "db_2",
					"title": "test_mysql",
					"id": 0,
				},
			];

			expect(() => utils.filterClassifiedDbs(classifiedAltrDbs, alationDbs)).toThrow();
		});
	});

});

// GETCLASSIFIERS()
describe('TESTING getClassifiers(classifiedAltrDbs)', () => {

	const url = encodeURI(`https://${process.env.ALTR_DOMAIN}/api/classification/classifiers/${0}`);

	describe('When classifiedAltrDbs is empty', () => {
		it('Shall throw an error', async () => {
			const classifiedAltrDbs = [];

			await expect(utils.getClassifiers(classifiedAltrDbs)).rejects.toThrow();
		});
	});

	describe('When classifiers exits for a database', () => {
		it('Shall return a map of dbid : [classifiers]', async () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];

			const classifiers = {
				"data": {
					"Classifications": [
						{
							"Type": "TEST CLASSIFIER",
							"Amount": 0,
							"Percent": 0
						}
					]
				},
				"success": true
			};

			const expected = new Map();
			expected.set(0, [
				{
					"Type": "TEST CLASSIFIER",
					"Amount": 0,
					"Percent": 0
				}
			]);

			mock.onGet(url).reply(200, classifiers);

			const result = await utils.getClassifiers(classifiedAltrDbs);
			expect(result).toStrictEqual(expected);
		});
	});

	describe('When getClassifiersOfDb() is unsuccessful', () => {
		it('Shall throw an error', async () => {
			const classifiedAltrDbs = [
				{
					"dbid": 0,
					"dbfriendlyname": "db_1",
					"classified": true,
					"dbname": "db_1"
				}
			];

			const classifiers = {
				"data": {
					"Classifications": [
						{
							"Type": "TEST CLASSIFIER",
							"Amount": 0,
							"Percent": 0
						}
					]
				},
				"success": true
			};

			const expected = new Map();
			expected.set(0, [
				{
					"Type": "TEST CLASSIFIER",
					"Amount": 0,
					"Percent": 0
				}
			]);

			mock.onGet(url).reply(400, classifiers);

			await expect(utils.getClassifiers(classifiedAltrDbs)).rejects.toThrow();
		});
	});
});
