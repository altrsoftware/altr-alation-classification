require('dotenv').config();
const alation = require('./api/alationApi');
const altr = require('./api/altrApi');
const utils = require('./utils.js');

// BUILDS BASE64 ENCODED STRING FOR ALTR API AUTH
const ALTR_AUTH = Buffer.from(`${process.env.ALTR_KEY_NAME}:${process.env.ALTR_KEY_PASSWORD}`).toString('base64');

let main = async () => {
	console.time('Execution Time');

	let alationPermissions = await alation.getUsers(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, process.env.ALATION_EMAIL);
	let altrPermissions = await altr.getAdministrators(process.env.ALTR_DOMAIN, ALTR_AUTH);

	if (altrPermissions && alationPermissions) {
		console.log('Permissions Passed\n');

		try {
			// Get list of databases in ALTR that have been classified 
			let classifiedAltrDbs = await altr.getClassifiedDbs(process.env.ALTR_DOMAIN, ALTR_AUTH);
			if (classifiedAltrDbs.length == 0) throw new Error('There are no classified databases in ALTR.');
			console.log('\nCLASSIFIED ALTR DATABASES: ' + classifiedAltrDbs.length);
			console.dir(classifiedAltrDbs, { depth: null });

			// Get a list of databases from Alation
			let alationDbs = await alation.getDatabases(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN);
			if (alationDbs.length == 0) throw new Error('There are no databases in Alation.');
			console.log('\nALATION DATABASES: ' + alationDbs.length);
			console.dir(alationDbs, { depth: null });

			// Filter list of classified ALTR databases to only include databases that also exist in Alation
			classifiedAltrDbs = utils.filterClassifiedDbs(classifiedAltrDbs, alationDbs);
			if (classifiedAltrDbs.length == 0) throw new Error('No matching databases between Alation databases and classified ALTR databases.');
			console.log('\nFILTERED CLASSIFIED ALTR DATABASES: ' + classifiedAltrDbs.length);
			console.dir(classifiedAltrDbs, { depth: null });

			// Get list of classifiers per database
			let classificationReports = new Map();
			classificationReports = await utils.getClassifiers(classifiedAltrDbs);
			console.log('\nCLASSIFICATION REPORTS: ');
			console.dir(classificationReports, { depth: null });

			// Get list of columns per classifier
			let columnsWithClassifiers = [];
			columnsWithClassifiers = await utils.getColumnsWithClassifiers(classificationReports.classifications);
			console.log('\nALTR CLASSIFIED COLUMNS: ' + columnsWithClassifiers.length);
			console.dir(columnsWithClassifiers, { depth: null });

			// Loop through columns, get corresponding Alation column data and build list of column/classifier objects for custom field value update
			let objects = [];
			objects = await utils.getClassificationMatchesArray(columnsWithClassifiers);
			console.log('\nUPDATE ALATION CUSTOM FIELD VALUE OBJECTS: ' + objects.length);
			console.dir(objects, { depth: null });

			// Updates custom field, "Classification Matches", of columns with classification values
			let objPerRequest = 50;
			for (let i = 1; i <= objects.length / objPerRequest + 1; i++) {
				let obj = utils.paginate(objects, objPerRequest, i);
				let response = await alation.putMultipleCustomFieldValues(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, obj);
				console.log('\nALATION CUSTOM FIELD (Classification Matches) UPDATE RESULT:')
				console.log(response);
			}

			// Send classification report to data source page
			let richTextCustomField = await alation.getMultipleCustomFields(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, 'RICH_TEXT', null, 'ALTR Classification Report');
			if (richTextCustomField.length != 0) {
				let richTextCustomFieldId = richTextCustomField[0].id;

				let richTexts = utils.createRichTexts(classificationReports, alationDbs, classifiedAltrDbs);
				for (const richTextUpdate of richTexts.entries()) {
					let obj = { field_id: richTextCustomFieldId, ts_updated: (new Date()).toISOString(), oid: richTextUpdate[0], value: richTextUpdate[1], otype: 'data' };
					let response = await alation.putMultipleCustomFieldValues(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, [obj]);
					console.log('\nALATION CUSTOM FIELD (ALTR Classification Report) UPDATE RESULT:')
					console.log(response);
				}
			}

			console.log('\nEFFECTED DATABASES:');
			console.log(classifiedAltrDbs);

		} catch (error) {
			if (!error.response) console.error(error);
			return;
		}
	} else {
		console.log('Please check environment variables and try again.');
	}

	console.timeEnd('Execution Time');
}


main();

