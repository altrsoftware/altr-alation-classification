const { default: axios } = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const querystring = require('querystring');
const args = require('yargs').argv;

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let login = async (domain, account, password) => {
	const url = encodeURI(`https://${domain}/login/`);

	try {
		await client.get(url);
		console.log(jar.toJSON());

		const postLoginOptions = {
			headers: { 'Referer': url },
		}

		const data = querystring.stringify({ 'csrfmiddlewaretoken': jar.toJSON().cookies[0].value, 'ldap_user': account, 'password': password })

		await client.post(url, data, postLoginOptions);
		console.log(jar.toJSON());

		await client.get(`https://${domain}/`);
		console.log(jar.toJSON());

	} catch (error) {
		throw error;
	}
}

let buildOptions = (countries) => {
	let options = '['
	if (countries == null || countries.length == 0) {
		for (const classifier of globalClassifications) {
			options += `{"title":"${classifier}", "tooltip_text":"", "old_index":null},`;
		}
		options = options.slice(0, -1);
		options += ']';
	}
	return options;
};


let main = async () => {
	try {
		let domain = args.domain;
		await login(domain, args.account, args.password);

		let dataColumn = {
			"field_type": "MULTI_PICKER",
			"name": "ALTR Classification",
			"name_plural": "ALTR Classifications",
			"name_singular": "ALTR Classification",
			"backref_name": "null",
			"backref_tooltip_text": "null",
			"allow_multiple": "true",
			"allowed_otypes": [],
			"options": buildOptions(),
			"builtin_name": "null",
			"universal_field": "false",
			"flavor": "DEFAULT",
			"tooltip_text": "Classification from ALTR"
		};

		let dataDatasource = {
			"field_type": "RICH_TEXT",
			"name": "ALTR Classification Report",
			"name_singular": "ALTR Classification Report",
			"backref_name": "null",
			"backref_tooltip_text": "null",
			"allowed_otypes": [],
			"builtin_name": "null",
			"universal_field": "false",
			"flavor": "DEFAULT",
			"tooltip_text": "Classification report overview from ALTR"
		};


		let postCustomFieldOptions = { headers: { 'X-CSRFToken': jar.toJSON().cookies[0].value, 'Cookie': `csrftoken=${jar.toJSON().cookies[0].value}; sessionid=${jar.toJSON().cookies[1].value}`, 'Referer': `https://${domain}/login/` } };
		let createCustomFieldColumn = await client.post(`https://${domain}/ajax/custom_field/`, dataColumn, postCustomFieldOptions);
		console.log(createCustomFieldColumn.data);

		let createCustomFieldDatasource = await client.post(`https://${domain}/ajax/custom_field/`, dataDatasource, postCustomFieldOptions);
		console.log(createCustomFieldDatasource.data);
	} catch (error) {
		console.log(error);
		return;
	}

	console.log('\nCUSTOM FIELDS CREATED!');
}

main();

let globalClassifications = [
	'AGE',
	'DATE',
	'ADVERTISING_ID',
	'CREDIT_CARD_NUMBER',
	'CREDIT_CARD_TRACKING_NUMBER',
	'DATE_OF_BIRTH',
	'DOMAIN_NAME',
	'EMAIL_ADDRESS',
	'ETHNIC_GROUP',
	'FEMALE_NAME',
	'FIRST_NAME',
	'GENDER',
	'GENERIC_ID',
	'IBAN_CODE',
	'HTTP_COOKIE',
	'ICD9_CODE',
	'ICD10_CODE',
	'IMEI_HARDWARE_ID',
	'IMSI_ID',
	'IP_ADDRESS',
	'LAST_NAME',
	'LOCATION',
	'MAC_ADDRESS',
	'MAC_ADDRESS_LOCAL',
	'MALE_NAME',
	'MEDICAL_TERM',
	'ORGANIZATION_NAME',
	'PASSPORT',
	'PERSON_NAME',
	'PHONE_NUMBER',
	'STREET_ADDRESS',
	'SWIFT_CODE',
	'STORAGE_SIGNED_POLICY_DOCUMENT',
	'STORAGE_SIGNED_URL',
	'TIME',
	'URL',
	'VEHICLE_IDENTIFICATION_NUMBER',
	'AUTH_TOKEN',
	'AWS_CREDENTIALS',
	'AZURE_AUTH_TOKEN',
	'BASIC_AUTH_HEADER',
	'ENCRYPTION_KEY',
	'GCP_API_KEY',
	'GCP_CREDENTIALS',
	'JSON_WEB_TOKEN',
	'PASSWORD',
	'WEAK_PASSWORD_HASH',
	'XSRF_TOKEN',
	'AMERICAN_BANKERS_CUSIP_ID',
	'FDA_CODE',
	'US_ADOPTION_TAXPAYER_IDENTIFICATION_NUMBER',
	'US_BANK_ROUTING_MICR',
	'US_DEA_NUMBER',
	'US_DRIVERS_LICENSE_NUMBER',
	'US_EMPLOYER_IDENTIFICATION_NUMBER',
	'US_HEALTHCARE_NPI',
	'US_INDIVIDUAL_TAXPAYER_IDENTIFICATION_NUMBER',
	'US_PASSPORT',
	'US_PREPARER_TAXPAYER_IDENTIFICATION_NUMBER',
	'US_SOCIAL_SECURITY_NUMBER',
	'US_STATE',
	'US_TOLLFREE_PHONE_NUMBER',
	'US_VEHICLE_IDENTIFICATION_NUMBER',
	'UK_NATIONAL_HEALTH_SERVICE_NUMBER'
];