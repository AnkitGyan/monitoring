import express from 'express';
import process from 'process';
import  promClient  from 'prom-client';
const app = express();

const requestCounter = new promClient.Counter({
  name : "http_requests_total",
  help : "Total number of Http requests",
  labelNames : ['methods', 'route', 'statuscode']
})

const middleware = (req, res, next)=>{
  const starttime = Date.now();
   
  res.on("finish", ()=>{
    const endtime = Date.now();
    console.log(`Request took ${endtime - starttime} ms`);
    requestCounter.inc({ methods: req.method, route: req.path, statuscode: res.statusCode });
  })

  next();
}

app.use(middleware);



app.get("/cpu", (req, res)=>{
  const cpuUsage = process.cpuUsage();
  let cpuUsageAfter;
  for(let i = 0; i < 1e7; i++) {
     cpuUsageAfter = process.cpuUsage(cpuUsage);
  }

  res.json({ cpuUsage: cpuUsageAfter });
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