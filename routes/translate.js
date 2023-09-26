var axios = require("axios");
const express = require("express");
const router = express.Router();
const redis = require("redis");

// Redis config
const redisClient = redis.createClient(6379, "127.0.0.1");
redisClient.connect();
redisClient.on("connect", function (err) {
    console.log("Redis Connected");
});

const expectedApiKey = process.env.SECRET_API_KEY;

function authenticateApiKey(req, res, next) {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed. Invalid API key.",
        });
    }
    // If the API key is valid, continue to the next middleware or route handler.
    next();
}

router.use(authenticateApiKey);

router.get('/', async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Translate api",
    });
});

router.post("/translate", async (req, res, next) => {
    try {
        let queryParameter = req.query;
        let translateTo = queryParameter.targetLanguage;
        if (!translateTo) {
            return res.status(400).json({
                success: false,
                message: "targetLangauge is required in query parameter",
            });
        }
        let data = req.body;
        if (Object.keys(data).length === 0) {
            res.status(400).json({
                success: false,
                messsage: "texts is required in the body e.g ['test', 'test2']",
            });
        } else {
            let getCacheData = await redisClient.get(translateTo);
            let foundTranslations = [];
            let notFoundTranslations = [];

            if (getCacheData) {
                const cachedData = JSON.parse(getCacheData);
                const mainTextsFromCache = cachedData.map((item) => item.main_text);
                for (const element of data) {
                    const dataIndex = mainTextsFromCache.indexOf(element);
                    if (dataIndex !== -1) {
                        foundTranslations.push(cachedData[dataIndex]);
                    } else {
                        notFoundTranslations.push({
                            Text: element,
                        });
                    }
                }
            } else {
                notFoundTranslations = data.map((text) => ({
                    Text: text,
                }));
            }
            if (notFoundTranslations.length > 0) {
                let config = {
                    method: "post",
                    url: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${translateTo}`,
                    headers: {
                        "Ocp-Apim-Subscription-Key": process.env.SUBSCRIPTION_KEY,
                        "Content-Type": "application/json",
                        "Ocp-Apim-Subscription-Region":
                            process.env.OCP_APIM_SUBSCRIPTION_REGION,
                    },
                    data: notFoundTranslations,
                };
                await axios(config)
                    .then(async function (response) {
                        const convertedFormat = notFoundTranslations.map(
                            (main_text, index) => ({
                                from_lang: response.data[index].detectedLanguage.language,
                                to_lang: response.data[index].translations[0].to,
                                main_text: main_text.Text,
                                translate_text: response.data[index].translations[0].text,
                            })
                        );
                        const cachedData = JSON.parse(getCacheData);
                        if (cachedData) {
                            cachedData.push(...convertedFormat);
                            await redisClient.set(translateTo, JSON.stringify(cachedData));
                        } else {
                            await redisClient.set(translateTo, JSON.stringify(convertedFormat));
                        }
                        getCacheData = await redisClient.get(translateTo);
                    })
            }

            res.status(200).json({
                success: true,
                data: JSON.parse(getCacheData),
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `An error occurred while processing the request. ${error}`,
        });
    }
});

module.exports = router;
