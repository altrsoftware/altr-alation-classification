<a  href="https://altr.com">

<img  src="./imgs/altr-logo.jpg"  alt="ALTR logo"  title="ALTR"  align="right"  height="40">

</a>

  
  

# Alation Classification Integration

The Alation Classification Integration is a tool to pass classification data of a database in ALTR into Alation.

This tool is plumbing between to available API's.
* [ALTR Management  API](https://altrnet.live.altr.com/api/swagger/)
* [Alation API](https://developer.alation.com/dev/reference/refresh-access-token-overview)

  
  

## How it works

**Prelude:** ALTR provides functionality to run data classification on a connected database. This functionality classifies columns based on the data within them.

  

The tool:

1. gets all databases from ALTR that have a classification report

2. gets the classifiers of said databases

3. gets the columns of said classifiers

4. gets corresponding Alation column data

5. adds classifier(s) to column in Alation

6. updates database page with ALTR classification report

  
  

## Why use it

<a  href="https://www.altr.com/">ALTR</a> partnered with <a  href="https://www.alation.com/">Alation</a> to fill a gap between data cataloging and data governance. With ALTR's powerful classification capability, you can use this tool to automatically pass classification results from ALTR in to Alation. This allows catalog admins in Alation to quickly and easily see how data is classified and make decisions based on those results.

  
  

## Visuals

Integration Flowchart:

  

<img  src="./imgs/alation-classification-integration-flowchart.png"  alt="Integration Flowchart"  height="700">

  

Alation Column before running the application:

<img  src="./imgs/before-running.png"  alt="Alation Column before running the application"  height="300">

  

Alation Column after running the application:

<img  src="./imgs/after-running.png"  alt="Alation Column after running the application"  height="300">

  
  

## Installation

**Install From Source**

  

$ git clone https://github.com/altrsoftware/altr-alation-classification.git

$ cd altr-alation-classification

  
  

## Before using the tool

  

**1. You must add a custom field to your Alation environment for this application to work successfully**

1. Click the settings gear in the top right of Alation

2. Under the *Catalog Admin* section, click *Customize Catalog*

3. Under the *Custom Fields* tab, add a *Multi-Select Pickers*

    - *Name (plural)*: Classification Matches

    - *Name (singular)*: Classification Match

    - *Tooltip Text*: Classification from ALTR

4. Click *+ Add Option* and each one from the list below

    - AGE

    - DATE

    - ADVERTISING_ID

    - CREDIT_CARD_NUMBER

    - CREDIT_CARD_TRACKING_NUMBER

    - DATE_OF_BIRTH

    - DOMAIN_NAME

    - EMAIL_ADDRESS

    - ETHNIC_GROUP

    - FEMALE_NAME

    - FIRST_NAME

    - GENDER

    - GENERIC_ID

    - IBAN_CODE

    - HTTP_COOKIE

    - ICD9_CODE

    - ICD10_CODE

    - IMEI_HARDWARE_ID

    - IMSI_ID

    - IP_ADDRESS

    - LAST_NAME

    - LOCATION

    - MAC_ADDRESS

    - MAC_ADDRESS_LOCAL

    - MALE_NAME

    - MEDICAL_TERM

    - ORGANIZATION_NAME

    - PASSPORT

    - PERSON_NAME

    - PHONE_NUMBER

    - STREET_ADDRESS

    - SWIFT_CODE

    - STORAGE_SIGNED_POLICY_DOCUMENT

    - STORAGE_SIGNED_URL

    - TIME

    - URL

    - VEHICLE_IDENTIFICATION_NUMBER

    - AUTH_TOKEN

    - AWS_CREDENTIALS

    - AZURE_AUTH_TOKEN

    - BASIC_AUTH_HEADER

    - ENCRYPTION_KEY

    - GCP_API_KEY

    - GCP_CREDENTIALS

    - JSON_WEB_TOKEN

    - PASSWORD

    - WEAK_PASSWORD_HASH

    - XSRF_TOKEN

    - AMERICAN_BANKERS_CUSIP_ID

    - FDA_CODE

    - US_ADOPTION_TAXPAYER_IDENTIFICATION_NUMBER

    - US_BANK_ROUTING_MICR

    - US_DEA_NUMBER

    - US_DRIVERS_LICENSE_NUMBER

    - US_EMPLOYER_IDENTIFICATION_NUMBER

    - US_HEALTHCARE_NPI

    - US_INDIVIDUAL_TAXPAYER_IDENTIFICATION_NUMBER

    - US_PASSPORT

    - US_PREPARER_TAXPAYER_IDENTIFICATION_NUMBER

    - US_SOCIAL_SECURITY_NUMBER

    - US_STATE

    - US_TOLLFREE_PHONE_NUMBER

    - US_VEHICLE_IDENTIFICATION_NUMBER

5. Under the *Custom Templates* tab, click *Column*

6. On the right side of the template, click *Insert* -> *Grouping of Custom Fields* -> *Classification Matches*

7. Or if you already have an ALTR grouping just add *Classification Matches* to it

8. Save the template

  

**2. Fill out the .env file environment variables**

    // ALATION
    
    ALATION_API_ACCESS_TOKEN = "Your Alation API Access Token"
    
    ALATION_DOMAIN = "Your Alation domain (example-prod.alationcatalog.com)"
    
    ALATION_EMAIL = "The email used to sign in and create the Access Token"
    
    //ALTR
    
    ALTR_DOMAIN = "Your ALTR domain (example.live.altr.com)"
    
    ALTR_KEY_NAME = "Your ALTR API key name"
    
    ALTR_KEY_PASSWORD = "Your ALTR API key password"

  
  

## How To Use

> **Warning**
> You must complete the **Before using the tool** section; otherwise, the integration will not work correctly.

**Method 1: <a  href="https://www.docker.com/">Docker</a>**

This method will install the necessary packages needed to run the application for you.

  

    $ docker build -t altr/alation-classification-integration .
    
    $ docker run -d altr/alation-classification-integration

  

**Method 2: Manually**

  

    $ npm install
    
    $ node index.js

  

## Dependencies

This application was built using the following node packages and their respected version:

  

* [node](https://nodejs.org/download/release/v16.0.0/) : 0.27.2

* [dotenv](https://www.npmjs.com/package/dotenv/v/16.0.3) : 16.0.3

* [axios](https://www.npmjs.com/package/axios/v/0.27.2) : 0.27.2

* [axios-mock-adapter](https://www.npmjs.com/package/axios-mock-adapter/v/1.21.2) : 1.21.2

* [jest](https://www.npmjs.com/package/jest/v/29.2.2) : 29.2.2

  

  

## Support

Need support to get this application running? Have questions, concerns or comments?

Email *application-engineers@altr.com* with a subject line of "Alation Classification Integration Support".

  

## License

[GNU General Public License](LICENSE.md)
