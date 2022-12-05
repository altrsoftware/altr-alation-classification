const axios = require('axios').default;

/**
 * Updates custom field, "Classification Matches", with classifiers
 * @param {String} alationDomain The domain of your Alation organization
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @param {Array} objects The objects that contain data to update custom field
 * @returns JS Object
 */
let putMultipleCustomFieldValues = async (alationDomain, alationApiAccessToken, objects) => {
	const options = {
		method: 'PUT',
		url: encodeURI(`https://${alationDomain}/integration/v2/custom_field_value/`),
		headers: { accept: 'application/json', 'content-type': 'application/json', TOKEN: alationApiAccessToken },
		data: objects
	};

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		if (error.response) {
			console.error('PUT multiple custom field values error');
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.putMultipleCustomFieldValues = putMultipleCustomFieldValues;

/**
 * Gets custom fields
 * @param {String} alationDomain The domain of your Alation organization 
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @param {String} field_type The custom field type
 * @param {String} name_plural The custom field name
 * @returns JS Array of Objects
 */
let getMultipleCustomFields = async (alationDomain, alationApiAccessToken, field_type, name_plural, name_singular) => {
	let options;
	if (name_plural == null) {
		options = {
			method: 'GET',
			url: encodeURI(`https://${alationDomain}/integration/v2/custom_field/?field_type=${field_type}&name_singular=${name_singular}`),
			headers: { accept: 'application/json', TOKEN: alationApiAccessToken },
		};
	} else {
		options = {
			method: 'GET',
			url: encodeURI(`https://${alationDomain}/integration/v2/custom_field/?field_type=${field_type}&name_plural=${name_plural}`),
			headers: { accept: 'application/json', TOKEN: alationApiAccessToken },
		};
	}

	try {
		let response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('GET multiple custom fields error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getMultipleCustomFields = getMultipleCustomFields;

/**
 * Gets array of available schemas in Alation 
 * @param {String} alationDomain The domain of your Alation organization 
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @returns JS Array of Objects
 */
let getDatabases = async (alationDomain, alationApiAccessToken) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${alationDomain}/integration/v1/datasource/?include_undeployed=false&include_hidden=true`),
		headers: { accept: 'application/json', TOKEN: alationApiAccessToken },
	};

	try {
		let response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('GET databases error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getDatabases = getDatabases;

/**
 * Gets array of available schemas in Alation 
 * @param {String} alationDomain The domain of your Alation organization 
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @returns JS Array of Objects
 */
let getSchemas = async (alationDomain, alationApiAccessToken) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${alationDomain}/integration/v2/schema/`),
		headers: { accept: 'application/json', TOKEN: alationApiAccessToken },
	};

	try {
		let response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('GET schemas error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getSchemas = getSchemas;

/**
 * Gets data of column in Alation
 * @param {String} alationDomain The domain of your Alation organization 
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @param {Number} dsId The database ID
 * @param {Number} schemaId The schema ID
 * @param {String} tableName The table name
 * @param {String} columnName The column name
 * @returns JS Object
 */
let getColumn = async (alationDomain, alationApiAccessToken, dsId, schemaId, tableName, columnName) => {
	const options = {
		method: 'GET',
		url: encodeURI(`https://${alationDomain}/integration/v2/column/?name=${columnName}&table_name=${tableName}&schema_id=${schemaId}&ds_id=${dsId}`),
		headers: { accept: 'application/json', TOKEN: alationApiAccessToken },
	};

	try {
		let response = await axios.request(options);
		return response.data;
	} catch (error) {
		if (error.response) {
			console.error('GET column error');
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
}
exports.getColumn = getColumn;

/**
 * Gets user info based on email
 * @param {String} alationDomain The domain of your Alation organization 
 * @param {String} alationApiAccessToken The Alation API Access Token (short-term) 
 * @param {String} email The email of user
 * @returns True || False
 */
let getUsers = async (alationDomain, alationApiAccessToken, email) => {
	let options = {
		method: 'GET',
		url: encodeURI(`https://${alationDomain}/integration/v1/user/?email=${email}&limit=100&skip=0`),
		headers: { TOKEN: alationApiAccessToken, accept: 'application/json' }
	}

	try {
		await axios.request(options);
		return true;
	} catch (error) {
		console.error('GET alation users error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		return false;
	}
};
exports.getUsers = getUsers;
