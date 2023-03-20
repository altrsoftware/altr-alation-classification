import * as alation from './api/alationApi.js';
import * as altr from './api/altrApi.js';
import * as utils from './utils.js';

let main = async () => {
	console.time(`Execution Time`);

	// Check if environment variables are set up correctly by attempting API calls to ALTR and Alation
	let alationPermissions = await alation.getUsers();
	let altrPermissions = await altr.getAdministrators();
	if (!alationPermissions || !altrPermissions) {
		console.error(`Permissions failed. Please check environment variables and try again.\n`);
		return;
	}
	console.log(`Permissions check passed\n`);

	try {
		// Get custom fields in Alation that will be updated with this script.
		let [altrClassifications, altrClassificationConfidence, altrClassificationReport] =
			await utils.getAllCustomFields();
		console.log(`Necessary custom fields exists and are in correct state for operations.`);

		// Get list of databases in ALTR that have been classified.
		let altrClassifiedDatabases = await altr.getClassifiedDatabases();

		// Error Handling & Logging
		if (altrClassifiedDatabases.length == 0) throw new Error(`There are no classified databases in ALTR.`);
		console.log(`\nCLASSIFIED ALTR DATABASES: ` + altrClassifiedDatabases.length);
		console.log(utils.getDatabaseNames(altrClassifiedDatabases));

		// Get list of databases from Alation
		let alationDatabases = await alation.getDatabases();

		// Error Handling & Logging
		if (alationDatabases.length == 0) throw new Error(`There are no databases in Alation.`);
		console.log(`\nALATION DATABASES: ` + alationDatabases.length);
		console.log(utils.getDatabaseNames(alationDatabases));

		// What: Filter list of classified ALTR databases to only include databases that also exist in Alation.
		// Why: We will only do operations with databases that exist in both systems.
		altrClassifiedDatabases = utils.getMatchingDatabases(altrClassifiedDatabases, alationDatabases);

		// Error Handling & Logging
		if (altrClassifiedDatabases.length == 0)
			throw new Error(`No matching databases between Alation databases and classified ALTR databases.`);
		console.log(`\nMATCHING CLASSIFIED ALTR DATABASES: ` + altrClassifiedDatabases.length);
		console.log(utils.getDatabaseNames(altrClassifiedDatabases));

		// What: Get classification data for each database (classifiers and totals).
		// Why: We will use this data to fill out Alation Classification Report on the Datasource page.
		let { classifiers, totals } = await utils.getClassificationData(altrClassifiedDatabases);

		// What: Get list of unique classifier names.
		// Why: We will use these classifiers to get columns that fall under said classifiers.
		let classifiersList = utils.getUniqueClassifierNames(classifiers);

		// What: Get columns from classified databases in ALTR that fall under each classifier.
		// Why: We will use this data to update column pages in Alation with classifiers and confidence scores.
		let columnToClassifierMap = await utils.getColumnsOfClassifiers(classifiersList, altrClassifiedDatabases);

		// What: Filter list of Alation databases to only include databases that also exist in ALTR and are classified.
		// Why: We use this data to get Alation columns. We filter it so we do not have to deal with irrelevant databases during operations.
		alationDatabases = utils.getMatchingDatabases(alationDatabases, altrClassifiedDatabases);

		// What: Get schemas from Alation databases
		// Why: We need the schema ID's to get Alation columns
		let alationSchemasMap = await utils.getAlationSchemas(alationDatabases);

		// What: Get columns from Alation
		// Why: We need Alation column object data to update columns in Alation
		let alationColumns = await utils.getAlationColumns(columnToClassifierMap, alationSchemasMap);

		// What: Build objects that update custom field `ALTR Classification` for each column
		// Why: We will pass this array of update objects into a PUT call to update Alation columns
		let classificationMultiPickerUpdateObjects = utils.buildColumnMultiPickerUpdateObjects(
			alationColumns,
			altrClassifications
		);

		// What: Build objects that update custom field `ALTR Classification Confidence` for each column
		// Why: We will pass this array of update objects into a PUT call to update Alation columns
		let classificationConfidenceRichTextUpdateObjects = utils.buildColumnRichTextUpdateObjects(
			alationColumns,
			altrClassificationConfidence
		);

		// What: Build objects that update custom field `ALTR Classification Report` for each database
		// Why: We will pass this array of update objects into a PUT call to update Alation datasources
		let classificationReportRichTextUpdateObjects = utils.buildDatabaseRichTextUpdateObjects(
			classifiers,
			totals,
			alationDatabases,
			altrClassificationReport
		);

		// What: Make API calls to Alation to update custom fields for each classified database and classified column
		let promises = [
			alation.updateMultipleCustomFieldValues(classificationMultiPickerUpdateObjects).then((response) => {
				return { field: 'Classifications', result: response };
			}),
			alation.updateMultipleCustomFieldValues(classificationConfidenceRichTextUpdateObjects).then((response) => {
				return { field: 'Confidence', result: response };
			}),
			alation.updateMultipleCustomFieldValues(classificationReportRichTextUpdateObjects).then((response) => {
				return { field: 'Report', result: response };
			}),
		];
		let responses = await Promise.allSettled(promises);

		console.dir(responses, { depth: null });
	} catch (error) {
		if (!error.response) console.error(error);
		return;
	}

	console.timeEnd(`Execution Time`);
	return;
};

main();
