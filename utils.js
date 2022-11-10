const altr = require('./api/altrApi.js');
const alation = require('./api/alationApi');
require('dotenv').config();

const altrAuth = Buffer.from(`${process.env.ALTR_KEY_NAME}:${process.env.ALTR_KEY_PASSWORD}`).toString('base64');

/**
 * Filters out classified ALTR databases to exclude ones that are not also in alation
 * @param {Array} classifiedAltrDbs 
 * @param {Array} alationDbs 
 * @returns 
 */
let filterClassifiedDbs = (classifiedAltrDbs, alationDbs) => {
	let result = classifiedAltrDbs.filter(altrDb => {
		return alationDbs.find(alationDb => {
			return altrDb.dbname.toUpperCase() === alationDb.dbname.toUpperCase();
		});
	});

	if (result.length == 0) throw new Error('There are no matching databases between Alation and classified AlTR databases');

	return result;
}
exports.filterClassifiedDbs = filterClassifiedDbs;


/**
 * Gets classifiers of classified databases in ALTR
 * @param {Array} classifiedAltrDbs 
 * @returns JS Map
 */
let getClassifiers = async (classifiedAltrDbs) => {
	if (classifiedAltrDbs.length == 0) throw new Error('classifiedAltrDbs is empty');

	let classifiersOfDbs = new Map();

	try {
		for (const db of classifiedAltrDbs) {
			let classifiers = await altr.getClassifiersOfDb(process.env.ALTR_DOMAIN, altrAuth, db.dbid);
			classifiersOfDbs.set(db.dbid, classifiers.data.Classifications);
		}
		return classifiersOfDbs;
	} catch (error) {
		throw error;
	}

};
exports.getClassifiers = getClassifiers;

/**
 * Gets a list of columns in ALTR and the classifiers they fall under
 * @param {Array} classifiersOfDbs 
 * @returns JS Array
 */
let getColumnsWithClassifiers = async (classifiersOfDbs) => {
	let columnsWithClassifiers = [];

	try {
		// LOOPS THROUGH CLASSIFIERS OF EACH DB, GETS THE COLUMNS UNDER EACH CLASSIFIER, BUILDS AN ARRAY OF COLUMNS WITH CLASSIFIERS
		for (const [dbid, classifiers] of classifiersOfDbs.entries()) {
			for (const classifier of classifiers) {
				let columns = await altr.getColumnsOfClassifierOfDb(process.env.ALTR_DOMAIN, altrAuth, classifier.Type, dbid);
				for (const column of columns.data) {
					let classifiers = column.alsoAppearsAs;
					classifiers.push(classifier.Type);
					classifiers.sort();
					let obj = { 'database': column.database, 'schema': column.schema, 'table': column.table, 'column': column.column, 'classifiers': classifiers };
					columnsWithClassifiers.push(obj);
				};
			};
		};

		// FILTERS A COLUMNS ARRAY OF CLASSIFIERS TO REMOVE DUPLICATES
		const seen = new Set();
		columnsWithClassifiers = columnsWithClassifiers.filter(element => {
			const duplicate = seen.has(element.database + '.' + element.schema + '.' + element.table + '.' + element.column);
			seen.add(element.database + '.' + element.schema + '.' + element.table + '.' + element.column);
			return !duplicate;
		});

		return columnsWithClassifiers;
	} catch (error) {
		throw error;
	}

};
exports.getColumnsWithClassifiers = getColumnsWithClassifiers;

/**
 * Gets list of objects with data to update custom field
 * @param {Array} columnsWithClassifiers 
 * @param {Number} customFieldId 
 * @returns JS Array
 */
let getClassificationMatchesArray = async (columnsWithClassifiers) => {
	let objects = [];

	try {
		// GET "CLASSIFICATION MATCHES" CUSTOM FIELD ID
		let customFields = await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, 'MULTI_PICKER', 'Classification Matches');
		let customFieldId = customFields[0].id;

		// GETS LIST OF DATABASES AND SCHEMAS IN ALATION
		const alationSchemas = await alation.getSchemas(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN);


		// BUILDS OBJECT FOR CUSTOM FIELD UPDATE FOR EACH COLUMN 
		for (const column of columnsWithClassifiers) {
			let altrSchemaName = column.database + '.' + column.schema;
			let alationSchema = alationSchemas.find((schema) => schema.name.toUpperCase() == altrSchemaName.toUpperCase());
			if (alationSchema == null) continue;
			let alationDatabaseId = alationSchema.ds_id;
			let alationSchemaId = alationSchema.id;
			let alationTableName = `${column.database.toLowerCase()}.${column.schema.toLowerCase()}.${column.table.toLowerCase()}`;

			let alationColumn = await alation.getColumn(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, alationDatabaseId, alationSchemaId, alationTableName, column.column);
			let columnId = alationColumn[0].id;

			objects.push({ field_id: customFieldId, ts_updated: (new Date()).toISOString(), otype: 'attribute', oid: columnId, value: column.classifiers });
		};

		return objects;
	} catch (error) {
		throw error;
	}
};
exports.getClassificationMatchesArray = getClassificationMatchesArray;