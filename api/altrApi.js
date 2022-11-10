const axios = require('axios').default;

/**
 * Gets list of databases that have been classified by ALTR
 * @param {String} altrDomain The domain of your ALTR organization
 * @param {String} altrAuth Base64 encoded string using your ALTR API key and password 
 * @returns JS Array of Objects
 */
let getClassifiedDbs = async (altrDomain, altrAuth) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${altrDomain}/api/classification/databases/?classificationCompleted=true`),
		headers: { Authorization: `Basic ${altrAuth}`, accept: 'application/json' }
	}

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('GET classified databases error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getClassifiedDbs = getClassifiedDbs;

/**
 * Gets Snowflake databases in ALTR
 * @param {String} altrDomain The domain of your ALTR organization
 * @param {String} basicAuth Base64 encoded string using your ALTR API key and password 
 * @returns JS Array of Objects
 */
let getDb = async (altrDomain, basicAuth, dbId) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${altrDomain}/api/databases/${dbId}`),
		headers: {
			'Authorization': 'Basic ' + basicAuth,
			'Content-Type': 'application/json'
		}
	};

	try {
		let response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('GET altr db error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}

};
exports.getDb = getDb;

/**
 * Gets list of classifiers of database in ALTR
 * @param {String} altrDomain The domain of your ALTR organization
 * @param {String} altrAuth Base64 encoded string using your ALTR API key and password 
 * @param {Number} dbId The ID of the database
 * @returns JS Array of Objects
 */
let getClassifiersOfDb = async (altrDomain, altrAuth, dbId) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${altrDomain}/api/classification/classifiers/${dbId}`),
		headers: { Authorization: `Basic ${altrAuth}`, accept: 'application/json' }
	}

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		if (error.response) {
			console.error('GET classifiers of database error');
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getClassifiersOfDb = getClassifiersOfDb;

/**
 * Gets columns of classifier in ALTR
 * @param {String} altrDomain The domain of your ALTR organization
 * @param {String} altrAuth Base64 encoded string using your ALTR API key and password 
 * @param {String} classifier The name of the classifier
 * @param {Number} dbId The ID of the database
 * @returns JS Array of Objects
 */
let getColumnsOfClassifierOfDb = async (altrDomain, altrAuth, classifier, dbId) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${altrDomain}/api/classification/columns/${classifier}/${dbId}`),
		headers: { Authorization: `Basic ${altrAuth}`, accept: 'application/json' }
	};

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		if (error.response) {
			console.error('GET columns of classifier error');
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getColumnsOfClassifierOfDb = getColumnsOfClassifierOfDb;

/**
 * Gets list of administrators in ALTR organization
 * @param {String} altrDomain The domain of your ALTR organization
 * @param {String} altrAuth Base64 encoded string using your ALTR API key and password
 * @returns True || False
 */
let getAdministrators = async (altrDomain, altrAuth) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${altrDomain}/api/administrators`),
		headers: {
			'Authorization': 'Basic ' + altrAuth,
			'Content-Type': 'application/json'
		}
	};

	try {
		await axios.request(options);
		return true;
	} catch (error) {
		console.error('GET altr administrators error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		return false;
	}
};
exports.getAdministrators = getAdministrators;