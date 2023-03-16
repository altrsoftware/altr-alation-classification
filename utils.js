const altr = require('./api/altrApi.js');
const alation = require('./api/alationApi');

/**
 * Gets necessary Alation custom fields for scripts operations.
 *
 * @async
 * @returns {Promise<Object[]>} An array of three custom fields.
 * @throws {Error} If there was an error while retrieving custom fields or if any of the required custom fields do not exist / have duplicates.
 */
const getAllCustomFields = async () => {
	const promises = [
		alation.getMultipleCustomFields(`MULTI_PICKER`, `ALTR Classification`),
		alation.getMultipleCustomFields(`RICH_TEXT`, `ALTR Classification Confidence`),
		alation.getMultipleCustomFields(`RICH_TEXT`, `ALTR Classification Report`),
	];
	try {
		const [altrClassifications, altrClassificationConfidence, altrClassificationReport] = await Promise.all(promises);

		if (altrClassifications.length != 1 || altrClassifications.length != 1 || altrClassifications.length != 1) {
			throw new Error(
				`Issue with necessary custom fields. There must be one existing custom field object for ALTR Classifications, ALTR Classification Confidence and ALTR Classification Report. No more, no less.`
			);
		}

		return [altrClassifications, altrClassificationConfidence, altrClassificationReport];
	} catch (error) {
		throw error;
	}
};
exports.getAllCustomFields = getAllCustomFields;

/**
 * Gets an array of database objects from the first array (`databasesOne`) that have a matching `dbname` property
 * in the second array (`databasesTwo`). Matching is case-insensitive.
 *
 * @param {Object[]} databasesOne - An array of database objects to compare.
 * @param {Object[]} databasesTwo - An array of database objects to compare against.
 * @returns {Object[]} An array of database objects that have a matching `dbname` property.
 */
const getMatchingDatabases = (databasesOne, databasesTwo) => {
	return databasesOne.filter((databaseOne) =>
		databasesTwo.find((databaseTwo) => databaseOne.dbname?.toUpperCase() === databaseTwo.dbname?.toUpperCase())
	);
};
exports.getMatchingDatabases = getMatchingDatabases;

/**
 * Gets an array of database names from an array of database objects.
 *
 * @param {Object[]} databases - An array of database objects.
 * @returns {String[]} An array of database names.
 */
const getDatabaseNames = (databases) => {
	return databases.map((database) => database.dbname);
};
exports.getDatabaseNames = getDatabaseNames;

/**
 * Gets classification data from ALTR for specified `altrClassifiedDatabases`.
 *
 * @async
 * @param {Object[]} altrClassifiedDatabases - An array of databases objects.
 * @returns {Promise<{ classifiers: Map<String, Object[]>, totals: Map<String, Object> }>} Two Maps: {Database -> [Classifiers]} & {Database -> Totals}.
 */
const getClassificationData = async (altrClassifiedDatabases) => {
	// Create an array of promises
	const promises = altrClassifiedDatabases.map((database) => {
		return altr.getClassifiersOfDatabase(database.dbid).then((response) => {
			return { param: database.dbname, response: response };
		});
	});

	// Resolves all promises
	const results = await Promise.allSettled(promises);

	// Populate Maps with data
	let classifiers = new Map();
	let totals = new Map();
	for (const result of results) {
		if (result.status != `fulfilled`) continue;

		classifiers.set(result.value.param, result.value.response.Classifications);
		totals.set(result.value.param, result.value.response.Totals);
	}

	return { classifiers, totals };
};
exports.getClassificationData = getClassificationData;

/**
 * Gets an array of unique classifier names from a map of classifiers.
 *
 * @param {Map<String, Object[]>} classifiers - A map of classifiers.
 * @returns {String[]} An array of unique classifier names.
 */
const getUniqueClassifierNames = (classifiers) => {
	let uniqueClassifierNames = new Set();
	for (const [key, value] of classifiers) {
		for (const classifier of value) {
			uniqueClassifierNames.add(classifier.Type);
		}
	}

	return [...uniqueClassifierNames];
};
exports.getUniqueClassifierNames = getUniqueClassifierNames;

/**
 * Gets columns of each classifier in `classifiers`.
 * Maps each column to an array of classifiers for that column.
 *
 * @async
 * @param {String[]} classifiers - An array of classifiers.
 * @param {Object[]} altrClassifiedDatabases - An array of database objects.
 * @returns {Promise<Map<String, String[]>>} A Map: {Column -> [Classifier:Confidence]}.
 */
const getColumnsOfClassifiers = async (classifiers, altrClassifiedDatabases) => {
	// Get all classified columns for each classifier
	let allClassifiedColumns = [];
	for (const classifier of classifiers) {
		let offset = 0;
		let moreColumns = true;
		let currentColumns = [];
		while (moreColumns) {
			let response = await altr.getColumnsOfClassifier(classifier, offset);

			if (response.length < 50) {
				moreColumns = false;
				currentColumns = currentColumns.concat(response);
			} else if (response.length == 50) {
				offset += 50;
				currentColumns = currentColumns.concat(response);
			} else if (response.length == 0) {
				moreColumns = false;
			}
		}
		allClassifiedColumns = allClassifiedColumns.concat(currentColumns);
	}

	// Filter out columns that are not in operating databases
	let databaseIds = altrClassifiedDatabases.map((database) => database.dbid);
	allClassifiedColumns = allClassifiedColumns.filter((column) => databaseIds.includes(column.clientDatabaseID));

	// For each column construct a column hash ID and an array of classifiers with confidence score for each classifier
	// Populate data in Map <columnHashId, [classifier:confidence]>
	let columnsMap = new Map();
	for (const column of allClassifiedColumns) {
		let columnHashId = `${column.database}.${column.schema}.${column.table}.${column.column}`;

		// If the current `column` is not in the map, add it to the map
		// If is already in the map, grab its classifiers array and edit it to add the confidence score to classifier
		if (!columnsMap.has(columnHashId)) {
			column.alsoAppearsAs.push(`${column.classifier[0]}:${column.confidence}`);
			columnsMap.set(columnHashId, column.alsoAppearsAs);
		} else {
			let classifiers = columnsMap.get(columnHashId);
			let currentClassifier = classifiers.find((classifier) => classifier === column.classifier[0]);
			let currentClassifierIndex = classifiers.indexOf(column.classifier[0]);
			currentClassifier = `${currentClassifier}:${column.confidence}`;
			classifiers[currentClassifierIndex] = currentClassifier;
		}
	}

	return columnsMap;
};
exports.getColumnsOfClassifiers = getColumnsOfClassifiers;

/**
 * Gets schemas in Alation for specified `alationDatabase`.
 * Exclude `INFORMATION_SCHEMA` and `ALTR_DSAAS` schemas.
 *
 * @async
 * @param {Object[]} alationDatabases - An array of database objects to retrieve schemas from.
 * @returns {Promise<Map<string,Object>>} A Map: {schema hash IDs -> schema object}.
 */
const getAlationSchemas = async (alationDatabases) => {
	// Get all schemas in Alation for specified `alationDatabases`
	let alationSchemas = [];
	const promises = alationDatabases.map((database) => {
		return alation.getSchemas(database.id);
	});
	const results = await Promise.all(promises).then((result) => result.flat(1));

	// Map schema hash ID to schema object
	let alationSchemaMap = new Map();
	for (const schema of results) {
		let schemaKeyArray = schema.key.split(`.`);

		// exclude `INFORMATION_SCHEMA` and `ALTR_DSAAS` schemas
		if (schemaKeyArray[2].toUpperCase() == `INFORMATION_SCHEMA` || schemaKeyArray[2].toUpperCase() == `ALTR_DSAAS`)
			continue;

		let schemaHashId = `${schemaKeyArray[1]}.${schemaKeyArray[2]}`.toUpperCase();
		alationSchemaMap.set(schemaHashId, schema);
	}
	return alationSchemaMap;
};
exports.getAlationSchemas = getAlationSchemas;

/**
 * Gets columns from Alation for each column in the provided `columnToClassifierMap`.
 *
 * @async
 * @param {Map<string,string>} columnToClassifierMap - A map of column hash IDs to their classifiers.
 * @param {Map<string,Object>} alationSchemasMap - A map of schema hash IDs to their corresponding schema objects.
 * @returns {Promise<Object[]>} An array of column objects with their classifiers added.
 */
const getAlationColumns = async (columnToClassifierMap, alationSchemasMap) => {
	let promises = [];
	for (const [key, value] of columnToClassifierMap) {
		let columnHashIdArray = key.split(`.`);
		let lookup = `${columnHashIdArray[0]}.${columnHashIdArray[1]}`.toUpperCase();
		let schema = alationSchemasMap.get(lookup);
		let databaseId = schema.ds_id;
		let schemaId = schema.id;
		let tableName = `${columnHashIdArray[0]}.${columnHashIdArray[1]}.${columnHashIdArray[2]}`.toLowerCase();
		let columnName = columnHashIdArray[3];

		promises.push(
			alation.getColumns(databaseId, schemaId, tableName, columnName).then((columns) => {
				let column = columns[0];
				column.classifiers = value;
				return column;
			})
		);
	}

	return await Promise.allSettled(promises).then((columns) => columns.map((column) => column.value));
};
exports.getAlationColumns = getAlationColumns;

/**
 * Builds an array of update objects for a multi-picker custom field that based on the provided columns..
 *
 * @param {Object[]} columns - An array of columns.
 * @param {Object[]} customField - An array of contains custom fields.
 * @returns {Objects[]} An array of custom field update objects containing an update object for each column.
 */
const buildColumnMultiPickerUpdateObjects = (columns, customField) => {
	let customFieldId = customField[0].id;
	return columns.map((column) => {
		let classifierArray = column.classifiers.map((classifier) => classifier.split(`:`)[0]);

		return {
			value: classifierArray,
			oid: column.id,
			otype: `attribute`,
			ts_updated: new Date().toISOString(),
			field_id: customFieldId,
		};
	});
};
exports.buildColumnMultiPickerUpdateObjects = buildColumnMultiPickerUpdateObjects;

/**
 * Builds an array of update objects for a rich-text custom field that based on the provided columns.
 *
 * @param {Object[]} columns - An array of columns.
 * @param {Object[]} customField - An array of contains custom fields.
 * @returns {Objects[]} An array of custom field update objects containing an update object for each column.
 */
const buildColumnRichTextUpdateObjects = (columns, customField) => {
	let customFieldId = customField[0].id;

	return columns.map((column) => {
		let richText = buildClassificationConfidenceRichText(column.classifiers);
		return {
			value: richText,
			oid: column.id,
			otype: `attribute`,
			ts_updated: new Date().toISOString(),
			field_id: customFieldId,
		};
	});
};
exports.buildColumnRichTextUpdateObjects = buildColumnRichTextUpdateObjects;

/**
 * Builds an array of update objects for a rich-text custom field that based on the provided classifiers and totals.
 *
 * @param {Map<String, Object[]>} classifiers A Map of database to classifiers.
 * @param {Map<String, Object>} totals - A Map of database to totals.
 * @param {Object[]} alationDatabases - An array of database objects.
 * @param {Object[]} customField - An array of contains custom fields.
 * @returns {Object[]} An array of custom field update objects containing an update object for each column.m
 */
const buildDatabaseRichTextUpdateObjects = (classifiers, totals, alationDatabases, customField) => {
	let customFieldId = customField[0].id;

	return alationDatabases.map((database) => {
		let richText = buildClassificationReportRichText(
			classifiers.get(database.dbname.toUpperCase()).sort((a, b) => b.Amount - a.Amount),
			totals.get(database.dbname.toUpperCase())
		);

		return {
			value: richText,
			oid: database.id,
			otype: `data`,
			ts_updated: new Date().toISOString(),
			field_id: customFieldId,
		};
	});
};
exports.buildDatabaseRichTextUpdateObjects = buildDatabaseRichTextUpdateObjects;

// HELPER FUNCTIONS

/**
 * Builds rich text value to update ALTR Classification Confidence custom field in Alation.
 * This value is HTML code and contains a table.
 *
 * @param {Map<String, String[]>} classifiers - A Map of database to classifiers.
 * @returns {String} Rich text value
 */
const buildClassificationConfidenceRichText = (classifiers) => {
	let richText = `<div><div><table><thead><tr><th>CLASSIFIER</th><th>CONFIDENCE SCORE</th></tr></thead><tbody>`;
	for (const classifier of classifiers) {
		let classifierConfidence = classifier.split(':');
		richText += `<tr><td>${classifierConfidence[0]}</td><td >${classifierConfidence[1]}</td></tr>`;
	}
	richText += `</tbody></table><p><br></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers of the column and the confidence score for each classifier.</em></p><p><em>Possible scores are: VERY LIKELY, LIKELY, POSSIBLE</em></p></div></div>`;

	return richText;
};

/**
 * Builds rich text value to update ALTR Classification Report custom field in Alation.
 * This value is HTML code and contains a table.
 *
 * @param {Map<String, String[]>} classifiers - A map of database to classifiers.
 * @param {Map<String, Object>} totals - A Map of database to totals.
 * @returns {String} Rich text value
 */
let buildClassificationReportRichText = (classifiers, totals) => {
	let richText =
		'<div><div><table style=width: 100%;><thead><tr><th>CLASSIFIER</th><th>% OF COLUMNS OF TOTAL CLASSIFIED COLUMNS</th><th># OF COLUMNS</th></tr></thead><tbody>';

	for (const classifier of classifiers) {
		richText += `<tr><td>${classifier.Type}</td><td>${classifier.Percent}%</td><td>${classifier.Amount}</td></tr>`;
	}
	richText += `</tbody></table><p><br></p><p><strong>${totals.ClassifiedColumns} of the ${totals.TotalColumns} total columns were classified. (${totals.PercentSuccesfullyClassified}%)</strong></p><p><em>This report is imported from ALTR.</em></p><p><em>It describes classifiers found in the database and the percentage of columns under said classifiers.</em></p></div></div>`;

	return richText;
};

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
