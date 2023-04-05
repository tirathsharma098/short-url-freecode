require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const urlData = require("./url_data.json");
const { urlencoded } = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
    res.json({ greeting: "hello API" });
});
function validURL(stringGot) {
    let url;
    try {
        url = new URL(stringGot);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
app.post("/api/shorturl", (req, res) => {
    const requestUrl = req.body.url;
    const isValidUrl = validURL(requestUrl);
    if (!isValidUrl) return res.status(400).json({ error: "Invalid URL" });
    const urlMainData = JSON.parse(fs.readFileSync("./url_data.json", "utf8"));
    let urlCount;
    for (const currentUrl in urlMainData) {
        if (currentUrl === requestUrl) {
            urlCount = urlMainData[`${currentUrl}`];
        }
    }
    let dataToSend;
    if (urlCount)
        dataToSend = { original_url: requestUrl, short_url: urlCount };
    else {
        const allNumbers = Object.values(urlMainData);
        let maxNum = 1;
        for (const currentNum of allNumbers) {
            if (Number(currentNum) > maxNum) maxNum = Number(currentNum);
        }
        maxNum += 1;
        const newMainData = {
            ...urlMainData,
            [`${requestUrl}`]: maxNum,
        };
        fs.writeFile("./url_data.json", JSON.stringify(newMainData), (err) => {
            if (err) return console.log(err);
        });
        dataToSend = { original_url: requestUrl, short_url: maxNum };
    }
    res.status(200).json(dataToSend);
});

app.get("/api/shorturl/:requestShortUrl", (req, res) => {
    const requestShortUrl = req.params.requestShortUrl;
    const urlMainData = JSON.parse(fs.readFileSync("./url_data.json", "utf8"));
    let urlFound;
    for (const [key, value] of Object.entries(urlMainData)) {
        if (Number(value) === Number(requestShortUrl)) urlFound = key;
    }
    if (!urlFound)
        return res
            .status(400)
            .json({ error: "No short URL found for the given input" });
    res.status(200).redirect(urlFound);
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
