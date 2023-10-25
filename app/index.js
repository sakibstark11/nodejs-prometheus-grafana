import express from "express";
import client from "prom-client";

const app = express();
const port = 3000;

const register = new client.Registry();
register.setDefaultLabels({
    app: "nodejs",
});
client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in microseconds",
    labelNames: ["method", "route", "code"],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

register.registerMetric(httpRequestDurationMicroseconds);

const httpRequestDurationMicrosecondsMiddleWare = (req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    next();
    end({ route: req.path, code: res.statusCode, method: req.method });
};

app.get("/health", httpRequestDurationMicrosecondsMiddleWare, (_, res) => {
    console.log("/health");
    res.json({ message: "ok" });
});

app.all("/metrics", async (_, res) => {
    console.log("/metrics");
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
});

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
