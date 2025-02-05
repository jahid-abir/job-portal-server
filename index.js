const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yqdya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db('jobPortal').collection('jobs')
    const applicationCollection = client.db('jobPortal').collection('application')

    // jobs Apis

    app.get('/jobs',async(req,res) =>{
        const email = req.query.email
        let query = {}
        if(email){
          query = {hr_email: email}
        }
        const cursor = jobsCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/jobs/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await jobsCollection.findOne(query)
        res.send(result)
    })

    app.post('/jobs',async(req,res)=>{
      const newJobs = req.body
      const result = await jobsCollection.insertOne(newJobs)
      res.send(result)
    })

    // job application api

    app.get('/job-applications/jobs/:job_id',async(req,res)=>{
      const jobID = req.params.job_id
      const query = {job_id: jobID}
      const result = await applicationCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/job-applications',async(req,res)=>{
      const email = req.query.email
      const query = {applicant : email}
      const result = await applicationCollection.find(query).toArray()

      // aggregate job data
      for(application of result){
        const id = application.job_id
        const query = {_id: new ObjectId(id)}
        const job = await jobsCollection.findOne(query)
        if(job){
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo
        }
      }

      res.send(result)
    })

    app.post('/job-applications',async(req,res)=>{
        const application = req.body
        const result = await applicationCollection.insertOne(application)
        res.send(result)
    })

    app.patch('/job-applications/:id',async(req,res)=>{
      const id = req.params.id
      const data = req.body
      const query = {_id: new ObjectId(id)}
      const updatedStatus = {
        $set:{
          status: data.status
        }
      }
      const result = await applicationCollection.updateOne(query,updatedStatus)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Job portal server is ready to run')
})

app.listen(port,()=>{
    console.log(`job portal is running on port: ${port}`);
})