import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { stringify } from 'querystring';
import { args } from 'yargs';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let login = async (domain, account, password) => {
	const url = encodeURI(`https://${domain}/login/`);

	try {
		await client.get(url);
		console.log(jar.toJSON());

		const postLoginOptions = {
			headers: { Referer: url },
		};

		const data = stringify({
			csrfmiddlewaretoken: jar.toJSON().cookies[0].value,
			ldap_user: account,
			password: password,
		});

		await client.post(url, data, postLoginOptions);
		console.log(jar.toJSON());

		await client.get(`https://${domain}/`);
		console.log(jar.toJSON());
	} catch (error) {
		throw error;
	}
};

let buildOptions = (countries) => {
	let options = '[';
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
		if (!args.domain || !args.account || !args.password) {
			throw Error(
				'Missing environment variables: $ node createCustomField.js --domain=<Alation Domain> --account=<Alation Login Email> --password=<Alation Login Password>'
			);
		}
		let domain = args.domain;
		await login(domain, args.account, args.password);

		let altrClassification = {
			field_type: 'MULTI_PICKER',
			name: 'ALTR Classification',
			name_plural: 'ALTR Classifications',
			name_singular: 'ALTR Classification',
			backref_name: 'null',
			backref_tooltip_text: 'null',
			allow_multiple: 'true',
			allowed_otypes: [],
			options: buildOptions(),
			builtin_name: 'null',
			universal_field: 'false',
			flavor: 'DEFAULT',
			tooltip_text: 'Classification from ALTR',
		};

		let altrClassificationReport = {
			field_type: 'RICH_TEXT',
			name: 'ALTR Classification Report',
			name_singular: 'ALTR Classification Report',
			backref_name: 'null',
			backref_tooltip_text: 'null',
			allowed_otypes: [],
			builtin_name: 'null',
			universal_field: 'false',
			flavor: 'DEFAULT',
			tooltip_text: 'Classification report overview from ALTR',
		};

		let altrClassificationConfidence = {
			field_type: 'RICH_TEXT',
			name: 'ALTR Classification Confidence',
			name_singular: 'ALTR Classification Confidence',
			backref_name: 'null',
			backref_tooltip_text: 'null',
			allowed_otypes: [],
			builtin_name: 'null',
			universal_field: 'false',
			flavor: 'DEFAULT',
			tooltip_text: 'Classification confidence scores from ALTR',
		};

		let postCustomFieldOptions = {
			headers: {
				'X-CSRFToken': jar.toJSON().cookies[0].value,
				Cookie: `csrftoken=${jar.toJSON().cookies[0].value}; sessionid=${jar.toJSON().cookies[1].value}`,
				Referer: `https://${domain}/login/`,
			},
		};
		let response = await client.post(
			`https://${domain}/ajax/custom_field/`,
			altrClassification,
			postCustomFieldOptions
		);
		console.log(response.data);

		response = await client.post(
			`https://${domain}/ajax/custom_field/`,
			altrClassificationReport,
			postCustomFieldOptions
		);
		console.log(response.data);

		response = await client.post(
			`https://${domain}/ajax/custom_field/`,
			altrClassificationConfidence,
			postCustomFieldOptions
		);
		console.log(response.data);
	} catch (error) {
		console.log(error);
		return;
	}

	console.log('\nCUSTOM FIELDS CREATED!');
};

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
	'UK_NATIONAL_HEALTH_SERVICE_NUMBER',
	'CANADA_QUEBEC_HIN',
	'INDIA_AADHAAR_INDIVIDUAL',
	'IDENTIFIER',
	'QUASI_IDENTIFIER',
	'SENSITIVE',
	'EMAIL',
	'IBAN',
	'IMEI',
	'VIN',
	'NAME',
	'PAYMENT_CARD',
	'US_BANK_ACCOUNT',
	'US_DRIVERS_LICENSE',
	'US_SSN',
	'US_STREET_ADDRESS',
	'ETHNICITY',
	'LATITUDE',
	'LAT_LONG',
	'LONGITUDE',
	'MARITAL_STATUS',
	'OCCUPATION',
	'US_POSTAL_CODE',
	'US_STATE_OR_TERRITORY',
	'US_COUNTY',
	'US_CITY',
	'YEAR_OF_BIRTH',
	'SALARY',
	'COUNTRY',
];
