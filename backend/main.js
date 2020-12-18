const { resolve } = require('path');

require('dotenv').config();
const express = require('express'),
	  bodyParser = require("body-parser"),
      cors = require('cors'),
      mysql = require("mysql2/promise"),
      morgan = require("morgan"),
      MongoClient = require("mongodb").MongoClient,
	  AWS = require('aws-sdk'),
	  multer = require('multer'),
	  { mkSQLQuery, mkMongoQuery } = require('./db_utils'),
	  fs = require('fs'),
	  crypto = require('crypto'),
	  sha1 = require('sha1');

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

//mongodb configuration
const DATABASE = 'opinions'
const COLLECTION = 'opinions'
const mongo_url = 'mongodb://localhost:27017'; 
const mongoClient = new MongoClient(mongo_url, {
    useNewUrlParser: true, useUnifiedTopology: true
})

//MySQL configuration
const pool = mysql.createPool({
    host: process.env.MYSQL_SERVER,//global.env.MYSQL_SERVER,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_SCHEMA,
    connectionLimit: process.env.MYSQL_CONNECTION
});
//console.log(pool);

//S3 configuration
const s3 = new AWS.S3({
	endpoint: new AWS.Endpoint(process.env.AWS_S3_HOSTNAME),
	accessKeyId: process.env.AWS_S3_ACCESSKEY_ID,
	secretAccessKey: process.env.AWS_S3_SECRET_ACCESSKEY
})

//file functions
const readFile = (path) => new Promise(
	(resolve, reject) => 
		fs.readFile(path, (err, buff) => {
			if (null != err)
				reject(err)
			else 
				resolve(buff)
		})
)

//reading and storing into S3
const putObject = (file, buff, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: file.filename, 
			Body: buff,
			ACL: 'public-read',
			ContentType: file.mimetype,
			ContentLength: file.size
		}
		s3.putObject(params, (err, result) => {
			if (null != err)
				reject(err)
			else
				resolve(result)
		})
	}
)

const getObject = (keyFilename, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: keyFilename
		}
		s3.getObject(params, function(err,result) {
			if (null !=err)
				reject(err)
			else
				resolve(result)
		});
	}
)

//multer configuration
const upload = multer({
  dest: process.env.TMP_DIR || "/tmp"
});

//mongodb parameters for insertion
const mongoParams = (params) => {
	return {
		ts: new Date(),
		title: params.title,
		comments: params.comments,
		imgRef: params.path
	}
}

//check server app
const startApp = async (app, pool) => {
	const conn = await pool.getConnection()
	try {
		console.info('Pinging database...');
		await conn.ping(); //try MySQL 
		//mongoClient.connect(); //try Mongo
		// app.listen(PORT, () => {
		// 	console.info(`Application started on port ${PORT} at ${new Date()}`);
		// });
	} catch(e) {
        console.error('Cannot ping database', e);
    } finally {
		conn.release();
	}
}



//MySQL queries
const loginSQL = "SELECT * FROM user where user_id = ? && password = ?";

const tryLogin = mkSQLQuery(loginSQL, pool);

//http handlers

app.post(`/login`, (req, res)=>{
	console.log(req.body);
	//var shasum = crypto.createHash('sha1');
	//var shahash = shashum.update(req.body.password,'utf-8');
	password = sha1(req.body.password);//shahash.digest('hex');
	console.log(password);
	
	// shasum.digest('hex');
	//password = sha1(req.body.password);
    tryLogin([req.body.username, password])//req.body.password])
    .then((result)=>{
		if(result.length <=0) {
			console.log("no results found");
			return res.status(401).json({errormessage: "Authentication fails"})
		}
		res.type("application/json");
		res.status(200).json(result);
        //res.status(200).json(result);
    }).catch((error)=>{
        res.status(401).json(error);
    })
});

app.post(`/backend`, upload.single('image'), (req, res)=>{
	console.info(req.body);
	
	// res.on('finish', () => {
	// 	// delete the temp file
	// 	fs.unlink(req.file.path, () => { })
	// })

	const doc = mongoParams(req.body)
	readFile(req.body.path)//.image)
		.then(buff => 
			putObject(req.file, buff, s3)
		)
		.then(() => 
			mongoClient.db(DATABASE).collection(COLLECTION)
				.insertOne(doc)
		)
		.then(results => {
			console.info('insert results: ', results)
			res.status(200)
			res.json({ id: results.ops[0]._id })
		})
		.catch(error => {
			console.error('insert error: ', error)
			res.status(500)
			res.json({ error })
		})

	//password = shasum.update((req.body.password).toString());
	//console.log(shasum.digest('hex'))

});

app.use(express.static(__dirname+'/dist/frontend'));


startApp(app, pool);

// const p0 = new Promise(
// 	async (resolve, reject) => {
// 		const conn = await pool.getConnection()
// 			.then(()=>{
// 				console.info('Pinging database...');
// 				conn.ping(); //try MySQL 
// 			})
// 			.then(()=>{
// 				resolve()
// 			})
// 			.catch(err=>{reject('Cannot ping database', err);})
// 			//.finally(conn.release())
// 		})

const p1 = new Promise(
	(resolve, reject) => {
		if ((!!process.env.AWS_S3_ACCESSKEY_ID) && (!!process.env.AWS_S3_SECRET_ACCESSKEY))
			resolve()
		else
			reject('S3 keys not found')
	}
)
const p2 = mongoClient.connect()

Promise.all([[p1, p2]])
	.then(()=>{startApp(app,pool)})
	.then(() => {
		app.listen(PORT, () => {
			console.info(`Application started on port ${PORT} at ${new Date()}`)
		})
	})
	.catch(err => { console.error('Cannot connect: ', err) })
