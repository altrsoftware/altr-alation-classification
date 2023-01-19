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
};
exports.filterClassifiedDbs = filterClassifiedDbs;


/**
 * Gets classification info of classified databases in ALTR
 * @param {Array} classifiedAltrDbs ALTR databases that have been classified
 * @returns JS Object
 */
let getClassifiers = async (classifiedAltrDbs) => {
	let classifications = new Map();
	let totals = new Map();

	try {
		// Loops through each ALTR database that has been classified
		for (const db of classifiedAltrDbs) {
			// Gets classifiers for database
			let classifiers = await altr.getClassifiersOfDb(process.env.ALTR_DOMAIN, ALTR_AUTH, db.dbid);
			if (classifiers.Classifications.length != 0) {
				// Sorts classifiers in descending order of percentage of columns under classifier 
				classifiers.Classifications = classifiers.Classifications.sort((a, b) => { return b.Percent - a.Percent });

				classifications.set(db.dbid, classifiers.Classifications);
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
 * Gets a list of ALTR columns under each classifier
 * @param {Array} classifications Classifications of databases data
 * @returns JS Array
 */
let getColumnsWithClassifiers = async (classifications) => {
	let columnsWithClassifiers = [];

	try {
		// Loops through each database
		for (const [dbid, classifiers] of classifications.entries()) {
			// Loops through each classifier in classifier list
			for (const classifier of classifiers) {
				// Gets columns under classifier for database
				let columns = await altr.getColumnsOfClassifierOfDb(process.env.ALTR_DOMAIN, ALTR_AUTH, classifier.Type, dbid);
				// Loops through columns
				for (const column of columns) {
					if (column != null) {

						// Checks if column has already been pushed to 'columnsWithClassifiers' as columns can be found under multiple classifiers
						// If it has, update column in 'columnsWithClassifier' by adding classifier to column
						let ob = columnsWithClassifiers.find((obj, i) => {
							if (obj.database == column.database && obj.schema == column.schema && obj.table == column.fullyQualifiedTableName.split(`.`)[1] && obj.column == column.column) {
								columnsWithClassifiers[i].classifiers.push(`${classifier.Type}:${column.confidence}`);
								return true;
							}
						});

						// If column has not been found in 'columnsWithClassifier' push column data to 'columnsWithClassifier'
						if (!ob) {
							let classifiers = [];
							classifiers.push(`${classifier.Type}:${column.confidence}`);
							classifiers.sort();
							let obj = { 'database': column.database, 'schema': column.schema, 'table': column.table, 'column': column.column, 'classifiers': classifiers };
							columnsWithClassifiers.push(obj);
						}
					}
				};
			};
		};

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
	let objectsConfidence = [];

	try {
		let customFields = await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, 'MULTI_PICKER', 'ALTR Classifications');
		if (customFields.length == 0) throw new Error('"ALTR Classifications" custom field was not found.')
		let customFieldId = customFields[0].id;

		// Gets list of schema's in Alation
		const alationSchemas = await alation.getSchemas(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN);

		// Build objects that are sent to Alation do update custom field for each column 
		for (const column of columnsWithClassifiers) {
			let altrSchemaName = column.database + '.' + column.schema;
			let alationSchema = alationSchemas.find((schema) => schema.name.toUpperCase() == altrSchemaName.toUpperCase());
			if (alationSchema == null) continue;
			let alationDatabaseId = alationSchema.ds_id;
			let alationSchemaId = alationSchema.id;
			let alationTableName = `${column.database.toLowerCase()}.${column.schema.toLowerCase()}.${column.table.toLowerCase()}`;

			let alationColumn = await alation.getColumn(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, alationDatabaseId, alationSchemaId, alationTableName, column.column);
			let columnId = alationColumn[0].id;
			let classifiers = [];

			for (const classifierConfidence of column.classifiers) {
				let classifier = classifierConfidence.split(':');
				classifiers.push(classifier[0]);
			}

			objects.push({ field_id: customFieldId, ts_updated: (new Date()).toISOString(), otype: 'attribute', oid: columnId, value: classifiers });
			objectsConfidence.push({ field_id: customFieldId, ts_updated: (new Date()).toISOString(), otype: 'attribute', oid: columnId, value: column.classifiers });
		};

		return { objects, objectsConfidence };
	} catch (error) {
		throw error;
	}
};
exports.getClassificationMatchesArray = getClassificationMatchesArray;

/**
 * Creates rich text values for ALTR Classification Report per database
 * @param {Map} classificationReports ALTR classification report for each database
 * @param {Array} alationDbs Alation databases
 * @param {Array} classifiedAltrDbs ALTR databases that have been classified
 * @returns JS Map
 */
let createClassificationReportRichText = (classificationReports, alationDbs, classifiedAltrDbs) => {
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
exports.createClassificationReportRichText = createClassificationReportRichText;

/**
 * Creates rich text values for ALTR Classification Confidence per column
 * @param {Array} objectsConfidence Objects that is sent to Alation do update custom field for each column
 * @returns JS Map
 */
let createClassificationConfidenceRichText = (objectsConfidence) => {
	let richTextUpdates = new Map();

	for (const object of objectsConfidence) {
		let richText = `<div><div><table style=width: 50%;><thead><tr><th>CLASSIFIER</th><th>CONFIDENCE SCORE</th></tr></thead><tbody>`;
		for (const classifierConfidence of object.value) {
			richText += `<tr><td style=width: 50.0000%;>${classifierConfidence.split(':')[0]}</td><td style=width: 50.0000%;>${classifierConfidence.split(':')[1]}</td></tr>`;
		}
		richText += `</tbody></table><p><br></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers of the column and the confidence score for each classifier.</em></p><p><em>Possible scores are: VERY LIKELY, LIKELY, POSSIBLE</em></p></div></div>`;
		richTextUpdates.set(object.oid, richText);
	}

	return richTextUpdates;
};
exports.createClassificationConfidenceRichText = createClassificationConfidenceRichText;

/**
 * Handles pagination of array
 * @param {Array} array An array
 * @param {Number} page_size Page size
 * @param {Number} page_number Page Number
 * @returns JS Array
 */
let paginate = (array, page_size, page_number) => {
	return array.slice((page_number - 1) * page_size, page_number * page_size);
};
exports.paginate = paginate;