const altr = require('./api/altrApi.js');
const alation = require('./api/alationApi');
require('dotenv').config();

const ALTR_AUTH = Buffer.from(`${process.env.ALTR_KEY_NAME}:${process.env.ALTR_KEY_PASSWORD}`).toString('base64');

/**
 * Filters out classified ALTR databases to exclude ones that are not also in alation
 * @param {Array} classifiedAltrDbs ALTR databases that have been classified
 * @param {Array} alationDbs Alation databases
 * @returns 
 */
let filterClassifiedDbs = (classifiedAltrDbs, alationDbs) => {
	return classifiedAltrDbs.filter(altrDb => {
		return alationDbs.find(alationDb => {
			if (altrDb.dbname != null && alationDb.dbname != null) {
				return altrDb.dbname.toUpperCase() === alationDb.dbname.toUpperCase();
			}
		});
	});
}
exports.filterClassifiedDbs = filterClassifiedDbs;


/**
 * Gets classifiers of classified databases in ALTR
 * @param {Array} classifiedAltrDbs ALTR databases that have been classified
 * @returns JS Map
 */
let getClassifiers = async (classifiedAltrDbs) => {
	let classifications = new Map();
	let totals = new Map();

	try {
		for (const db of classifiedAltrDbs) {
			let classifiers = await altr.getClassifiersOfDb(process.env.ALTR_DOMAIN, ALTR_AUTH, db.dbid);
			if (classifiers.Classifications.length != 0) {
				classifications.set(db.dbid, classifiers.Classifications.sort((a, b) => {return b.Percent - a.Percent}));
				totals.set(db.dbid, classifiers.Totals);
			}
		}
		return { classifications, totals };
	} catch (error) {
		throw error;
	}

};
exports.getClassifiers = getClassifiers;

/**
 * Gets a list of columns in ALTR and the classifiers they fall under
 * @param {Array} classifications Classifications of databases data
 * @returns JS Array
 */
let getColumnsWithClassifiers = async (classifications) => {
	let columnsWithClassifiers = [];

	try {
		// LOOPS THROUGH CLASSIFIERS OF EACH DB, GETS THE COLUMNS UNDER EACH CLASSIFIER, BUILDS AN ARRAY OF COLUMNS WITH CLASSIFIERS
		for (const [dbid, classifiers] of classifications.entries()) {
			for (const classifier of classifiers) {
				let columns = await altr.getColumnsOfClassifierOfDb(process.env.ALTR_DOMAIN, ALTR_AUTH, classifier.Type, dbid);
				for (const column of columns) {
					if (column != null) {
						let classifiers = column.alsoAppearsAs;
						classifiers.push(classifier.Type);
						classifiers.sort();
						let obj = { 'database': column.database, 'schema': column.schema, 'table': column.table, 'column': column.column, 'classifiers': classifiers };
						columnsWithClassifiers.push(obj);
					}
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
 * @param {Array} columnsWithClassifiers Column data with its classifications
 * @returns JS Array
 */
let getClassificationMatchesArray = async (columnsWithClassifiers) => {
	let objects = [];

	try {
		// GET "CLASSIFICATION MATCHES" CUSTOM FIELD ID
		let customFields = await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, 'MULTI_PICKER', 'ALTR Classifications');
		if (customFields.length == 0) throw new Error('"ALTR Classifications" custom field was not found.')
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

/**
 * 
 * @param {Map} classificationReports ALTR classification report for each database
 * @param {Array} alationDbs Alation databases
 * @param {Array} classifiedAltrDbs ALTR databases that have been classified
 * @returns JS Map
 */
let createRichTexts = (classificationReports, alationDbs, classifiedAltrDbs) => {
	let richTextUpdates = new Map();

	for (const [dbid, classifiers] of classificationReports.classifications.entries()) {
		let altrDb = classifiedAltrDbs.find(db => dbid == db.dbid);
		let alationDb = alationDbs.find(db => altrDb.dbname == db.dbname.toUpperCase());

		if (!altrDb || !alationDb) continue;

		let richText = "<div><div><table style=width: 100%;><thead><tr><th>CLASSIFIER</th><th>% OF COLUMNS IN DATABASE CLASSIFIED AS</th></tr></thead><tbody>";
		for (const classifier of classifiers) {
			richText += `<tr><td style=width: 50.0000%;>${classifier.Type}</td><td style=width: 50.0000%;>${classifier.Percent}%</td></tr>`;
		}
		let total = classificationReports.totals.get(dbid);
		richText += `</tbody></table><p><br></p><p><strong>${total.ClassifiedColumns} of the ${total.TotalColumns} total columns were classified. (${total.PercentSuccesfullyClassified}%)</strong></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers found in the database and the percentage of columns under said classifiers.</em></p></div></div>`;
		richTextUpdates.set(alationDb.id, richText);
	}

	return richTextUpdates;
};
exports.createRichTexts = createRichTexts;

/**
 * Handles pagination of array
 * @param {Array} array An array
 * @param {Number} page_size Page size
 * @param {Number} page_number Page Number
 * @returns JS Array
 */
let paginate = (array, page_size, page_number) => {
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}
exports.paginate = paginate;