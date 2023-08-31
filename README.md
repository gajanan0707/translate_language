
# Language Translate (Cached Translation API with Redis)


# Project Overview:
The Cached Translation API with Redis is a service that provides efficient translation capabilities using the Microsoft Translator API while leveraging Redis for caching. This project aims to reduce API calls and improve response times by storing and retrieving translated text data from a Redis cache.


## Run Locally

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd translate_language
```

Install dependencies

```bash
  npm install
```

## Setup Redis
[Documentation Redis Installation](https://redis.io/docs/getting-started/installation/install-redis-on-linux/)


Start the server

```bash
  npm run start
```
## Run the app
```
# Run in development mode
npm run devStart

# Run in production mode
npm start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`SUBSCRIPTION_KEY`

`OCP_APIM_SUBSCRIPTION_REGION`


## API Reference
To get the translation, we can Postman or any web browser and hit this API as follow:

```http
 # URL: (http://localhost:5000) or Deployed link

 POST {URL}/translate?to=''
```

We have to pass one `Query Params` `targetLanguage`
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `targetLanguage`      | `string` | **Required**.              |

```
We have to pass `body` with list of text's

```
[
    "Hello How, are you",
    "Hello, what is your name?"
]
```
- `targetLanguage`: the langauge to be it has to be translated
<br>**NOTE:**
  - for the `targetLangauge`, only **ISO Language code** should be passed as value.
<br/>For example:
    - "hi" for Hindi
    - "ja" for Japanese
    - "fa" for Persian, etc.
    <br/>A list of all [ISO Language Codes](https://datahub.io/core/language-codes/r/0.html) is attached here.

## Screenshots

![App Screenshot](https://i.imgur.com/46GxwKG.png)

## Badges
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)
