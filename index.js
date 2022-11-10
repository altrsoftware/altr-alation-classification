require('dotenv').config();
const alation = require('./api/alationApi');
const altr = require('./api/altrApi');
const utils = require('./utils.js');

// BUILDS BASE64 ENCODED STRING FOR ALTR API AUTH
const altrAuth = Buffer.from(`${process.env.ALTR_KEY_NAME}:${process.env.ALTR_KEY_PASSWORD}`).toString('base64');

let main = async () => {
	console.time('Execution Time');

	let alationPermissions = await alation.getUsers(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, process.env.ALATION_EMAIL);
	let altrPermissions = await altr.getAdministrators(process.env.ALTR_DOMAIN, altrAuth);

	if (altrPermissions && alationPermissions) {
		console.log('Permissions Passed\n');

		try {
			// GET LIST OF DATABASES THAT HAVE BEEN CLASSIFIED IN ALTR & AlATION DBS
			let classifiedAltrDbs = await altr.getClassifiedDbs(process.env.ALTR_DOMAIN, altrAuth);
			let alationDbs = await alation.getDatabases(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN);

			if (classifiedAltrDbs == []) {
				console.log('There are no classified databases in ALTR');
				return;
			}

			if (alationDbs == []) {
				console.log('There are no databases in Alation');
				return;
			}

			// FILTER CLASSIFIED ALTR DBS TO EXCLUDE DBS THAT ARE NOT IN ALATION
			classifiedAltrDbs.data = utils.filterClassifiedDbs(classifiedAltrDbs.data, alationDbs);

			if (classifiedAltrDbs.data == []) {
				console.log('No matching databases between Alation databases and classified ALTR databases');
				return;
			}

			// GETS LIST OF CLASSIFIERS OF EACH DB
			let classifiers = new Map();
			classifiers = await utils.getClassifiers(classifiedAltrDbs.data);

			// GETS COLUMN DATA AND ITS CLASSIFIERS
			let columnsWithClassifiers = [];
			columnsWithClassifiers = await utils.getColumnsWithClassifiers(classifiers);

			// LOOPS THROUGH COLUMN ARRAY, GETS ALATION DATA FOR COLUMN, BUILDS AN ARRAY OF OBJECTS FOR UPDATING "CLASSIFICATION MATCHES" CUSTOM FIELD PER COLUMN
			let objects = [];
			objects = await utils.getClassificationMatchesArray(columnsWithClassifiers);

			// SETS CLASSIFIERS IN CUSTOM FIELD, "CLASSIFICATION MATCHES", PER COLUMN
			let response = await alation.putMultipleCustomFieldValues(process.env.ALATION_DOMAIN, process.env.ALATION_API_ACCESS_TOKEN, objects);

			console.log('Alation Custom Field Update Result:')
			console.log(response);

			console.log('\nEffected Databases:');
			console.log(classifiedAltrDbs.data);
			
		} catch (error) {
			console.error('\n\nERROR:')
			console.error(error);
			return;
		}
	} else {
		console.log('Please check environment variables and try again.');
	}

	console.timeEnd('Execution Time');
}


main();