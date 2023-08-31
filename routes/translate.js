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

router.get('/', async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Translate api",
    });
});

router.post("/translate", async (req, res, next) => {
    let queryParameter = req.query;
    let translateTo = queryParameter.targetLanguage;
    if (!translateTo) {
        return res.status(400).json({
            success: false,
            message: "targetLangauge is required in query parameter",
        });
    }
    let data = req.body;
    if (data.length > 0) {
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
                .catch(function (error) {
                    console.log(error);
                });
        }

        res.status(200).json({
            success: true,
            data: JSON.parse(getCacheData),
        });
    }
    res.status(400).json({
        success: false,
        messsage: "text is required in the body ",
    });
});

module.exports = router;
