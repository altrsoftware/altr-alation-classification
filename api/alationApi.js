require('dotenv').config();
const axios = require('axios').default;

const alationAxios = require('axios').create({
	baseURL: encodeURI(`https://${process.env.ALATION_DOMAIN}/integration`),
	headers: {
		TOKEN: process.env.ALATION_API_ACCESS_TOKEN,
	},
});

/**
 * Gets users in Alation.
 *
 * @async
 * @returns {Promise<Boolean>} True || False
 */
const getUsers = async () => {
	try {
		await alationAxios.get(`/v1/user/?email=${process.env.ALATION_EMAIL}&limit=100&skip=0`);
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

/**
 * Gets databases in Alation.
 * Exclude `undeployed` databases.
 *
 * @async
 * @returns {Promise<Object[]>} An array of database objects.
 */
const getDatabases = async () => {
	try {
		let response = await alationAxios.get(`/v1/datasource/?include_undeployed=false&include_hidden=true`);
		return response.data;
	} catch (error) {
		console.error('GET Alation databases error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.getDatabases = getDatabases;

/**
 * Gets custom fields in Alation using `field_type` and `name_singular` as search parameters.
 *
 * @async
 * @param {String} field_type - The type of the custom field.
 * @param {String} name_singular - The name of the custom field.
 * @returns {Promise<Object[]>} An array of custom field objects.
 */
const getMultipleCustomFields = async (field_type, name_singular) => {
	try {
		let response = await alationAxios.get(`/v2/custom_field/?field_type=${field_type}&name_singular=${name_singular}`);
		return response.data;
	} catch (error) {
		console.error('GET multiple custom fields error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.getMultipleCustomFields = getMultipleCustomFields;

/**
 * Gets schemas in Alation for specified `databaseId`.
 *
 * @async
 * @param {String} databaseId - Alation database ID
 * @returns {Promise<Object[]>} - An array of schema objects
 */
const getSchemas = async (databaseId) => {
	try {
		let response = await alationAxios.request(`/v2/schema/?ds_id=${databaseId}`);
		return response.data;
	} catch (error) {
		console.error('GET schemas error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.getSchemas = getSchemas;

/**
 * Gets columns in Alation for specified `databaseId`, `schemaId`, `tableName` and `columnName`.
 *
 * @async
 * @param {Number} databaseId - The ID of the database.
 * @param {Number} schemaId - The ID of the schema.
 * @param {String} tableName - The name of the table.
 * @param {String} columnName - The name of the column.
 * @returns {Promise<Object[]>} An array of column objects.
 */
const getColumns = async (databaseId, schemaId, tableName, columnName) => {
	try {
		let response = await alationAxios.get(
			`/v2/column/?ds_id=${databaseId}&schema_id=${schemaId}&table_name=${tableName}&name=${columnName}`
		);
		return response.data;
	} catch (error) {
		console.error('GET column error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.getColumns = getColumns;

/**
 * Updates custom field for specified objects within `updateObjects`.
 *
 * @async
 * @param {Object[]} updateObjects - The objects that contain information about what object's custom field to update with update data.
 * @returns {Promise<Object>} Results of updates.
 */
const updateMultipleCustomFieldValues = async (updateObjects) => {
	try {
		const response = await alationAxios.put(`/v2/custom_field_value/`, updateObjects);
		return response.data;
	} catch (error) {
		console.error('PUT multiple custom field values error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
exports.updateMultipleCustomFieldValues = updateMultipleCustomFieldValues;
