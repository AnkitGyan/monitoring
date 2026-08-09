import express from 'express';
import process from 'process';
import  promClient  from 'prom-client';
const app = express();

const requestCounter = new promClient.Counter({
  name : "http_requests_total",
  help : "Total number of Http requests",
  labelNames : ['methods', 'route', 'statuscode']
})

const activeRequestsGauge = new promClient.Gauge({
  name : "active_http_requests",
  help : "Number of active HTTP requests"
})


const httpRequestDurationInMilliseconds = new promClient.Histogram({
  name:"http_request_duration_ms",
  help:"Duration of HTTP requests in ms",
  labelNames: ['methods', 'route', 'statuscode'],
  buckets:[0.1, 5, 15, 50, 100, 200, 300, 400, 500, 1000]
})

const middleware = (req, res, next)=>{
  activeRequestsGauge.inc();
  const starttime = Date.now();
   
  res.on("finish", ()=>{
    const endtime = Date.now();
    console.log(`Request took ${endtime - starttime} ms`);
    requestCounter.inc({ methods: req.method, route: req.path, statuscode: res.statusCode });
    activeRequestsGauge.dec(); 
  })

  httpRequestDurationInMilliseconds.observe({methods: req.method, route : req.path, statuscode: res.statusCode}, Date.now() - starttime);

  next();
}

app.use(middleware);



app.get("/cpu",async (req, res)=>{
  await new Promise(resolve=> setTimeout(resolve, 1000))

  res.json({ cpuUsag: process.cpuUsage() });
})


app.get("/user", (req, res)=>{
  const userInfo = process.getuid?.toString() || "Not supported on this platform";
  res.json({ userInfo });
})

app.get("/metrics", async (req, res)=>{
  const metrics = await promClient.register.metrics();
  console.log(promClient.register.contentType);
  res.set('Content-Type', promClient.register.contentType);
  res.send(metrics);
})

app.listen(3000, ()=>{
  console.log("server is listening on port 3000");
})