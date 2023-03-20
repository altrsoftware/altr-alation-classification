import 'dotenv-defaults/config.js';
import axios from 'axios';

// Builds base64 encoded string for ALTR API Auth
const ALTR_AUTH = Buffer.from(`${process.env.ALTR_KEY_NAME}:${process.env.ALTR_KEY_PASSWORD}`).toString('base64');

const altrAxios = axios.create({
	headers: {
		Authorization: `Basic ${ALTR_AUTH}`,
	},
	baseURL: encodeURI(`https://${process.env.ALTR_DOMAIN}/api`),
});

/**
 * Gets administrators in ALTR organization.
 *
 * @async
 * @returns {Promise<Boolean>} True || False
 */
export const getAdministrators = async () => {
	try {
		await altrAxios.get(`/administrators`);
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

/**
 * Gets classified databases in ALTR.
 *
 * @async
 * @returns {Promise<Object[]>} Array of classified databases objects.
 */
export const getClassifiedDatabases = async () => {
	try {
		const response = await altrAxios.get(`/classification/databases/?classificationCompleted=true`);
		return response.data.data;
	} catch (error) {
		console.error('GET classified databases error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};

/**
 * Gets classification data for specified database.
 *
 * @async
 * @param {Number} databaseId - The ID of the database.
 * @returns {Promise<Object[]>} - Array of classification data for database.
 */
export const getClassifiersOfDatabase = async (databaseId) => {
	try {
		const response = await altrAxios.get(`/classification/classifiers/${databaseId}`);
		return response.data.data;
	} catch (error) {
		console.error('GET classifiers of database error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};

/**
 * Gets columns that fall under specified `classifier`.
 *
 * @async
 * @param {String} classifier - Classifier.
 * @param {Number} offset - Used for pagination.
 * @returns {Promise<Object[]>} Array of columns objects.
 */
export const getColumnsOfClassifier = async (classifier, offset) => {
	try {
		const response = await altrAxios.get(`/classification/columns/${classifier}?offset=${offset}&limit=50`);
		return response.data.data;
	} catch (error) {
		console.error('GET columns of classifier error');
		if (error.response) {
			console.error(error.response.data);
			console.error(error.response.status);
		}
		throw error;
	}
};
