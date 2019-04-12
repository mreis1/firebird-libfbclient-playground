var fb  = require("firebird");

const argv = require('yargs') // eslint-disable-line
    .option('sampleCode', {
    	alias: 'c',
        default: null
    })
    .options('timeout', {
    	alias: 't',
    	default: 100
    })
    .options('server', {
    	alias: 's',
    	default: false
    })
    .options('exitTimeout', {
    	alias: 'et',
    	default: 1000
    }).argv;

var c = argv.sampleCode,
	t = argv.timeout;

var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

var server;
if (argv.server){
	var http = require('http');
	//create a server object:
	let port = 8714;
	console.log('listening on port ' + port);
	var server = http.createServer(function (req, res) {
	  res.write('Hello World!'); //write a response to the client
	  res.end(); //end the response
	});
	server.listen(port); //the server object listens on port 8080
}


process.on('SIGTERM', function () {
	if (server) {
		server.close();
	}
	process.exit(0);
})

if (c === null || c === undefined)
	throw new Error('--sampleCode= is required.')

if (c == 0) {
	con.query('DELETE FROM TEST_TABLE', function(err){
		if (err) throw err;
		con.commitSync();
	})
}

console.log('Running ', c)

const exitDelay = (code) => {
	console.log('Exiting in ' + argv.et);
	setTimeout(()=>{
		console.log('Done')

	}, argv.et)
};

function createConnection(){
	var con = fb.createConnection();
	let cc = process.env['FB_SERVER']+ ':C:\\_MARCIO_DEV\\_EXPERIENCES\\_TEST_DATABASES\\TEST_DB.fdb';
	con.connectSync(cc,'sysdba',process.env['FB_PASSWORD'],'');
	console.log('createConnection.inTransaction', con.inTransaction);
	return con;
}

if (c == 1) {
	let con = createConnection();
	con.query('INSERT INTO TEST_TABLE(XVALUE) VALUES (\'X1\')', function(err){
		if (err) throw err;
		console.log(con.inTransaction);
		setTimeout(function(){
			console.log('x1')
			con.commitSync()
			/*function(err){
				if (err) throw err;
			
				console.log('Commit done');
			}*/
		},t)
	});
}

if (c == 2) {
	/* Sample 2: Async commit doesn't "commit"....*/
	let con = createConnection();
	con.query('INSERT INTO TEST_TABLE(XVALUE) VALUES (\'X1\')', function(err){
		if (err) throw err;
		console.log(con.inTransaction);
		setTimeout(function(){
			console.log('x1')
			
			con.commit((err) => {
				// The callback is never executed
				console.log('commit callback executed')
				con.disconnect();
			})
		},t)
	});
}


if (c == 3) {
	/* Sample 2: Async commit doesn't "commit"....*/
	console.log('Sample3: Read data from stored procedure')
	let con = createConnection();
	con.query('select * from TEST_PROCEDURE', function(err){
		if (err) throw err;
		console.log(con.inTransaction);
		setTimeout(function(){
			console.log('Request commit')
			con.commitSync()
			console.log('commit ok!')
			console.log('inTransaction ' + con.inTransaction)
			exitDelay();
		},t)
	});
}



if (c == 4 || c==5) {
	/* Sample 2: Async commit doesn't "commit"....*/
	console.log('Sample3: Read data from stored procedure')
	let con = createConnection();

	con.query('select * from TEST_PROCEDURE', function(err, qres){
		if (err) throw err;
		
		new Promise((resolve, reject) => {
			let results = [];
	        qres.fetch(1, true, rowCallback, eofCallback);

	        function rowCallback(row) {
                results.push(row);
	        }

	        function eofCallback(err) {
	            if (err) {
	                return reject(err);
	            }
	            resolve(results);
	        }
		}).then((data)=>{

			console.log('inTransaction ' + con.inTransaction);
			console.log(data)
			console.log('Commit will run in ' + t +' ms ');
			setTimeout(function(){
				
				try {
					if (c == 4){
						console.log('Request commit async')
						try {
							con.commit((err) => {
								console.log('commit async ok!')
								console.log('inTransaction ' + con.inTransaction)		
							});		
						}  catch (err) {
							console.log('Failed to con.commit()');
						}
						console.log('This will never run')
						exitDelay();
					} else if (c === 5){
						console.log('Request commit sync')
						con.commitSync();	
						exitDelay();
					}
					
				} catch (err){
					console.log(err);
				}
				
				
			},t)
		})
		.catch((err)=>{
			console.log(err);
			con.disconnect();
		})
	});
}

if (c == 6) {
	let con = createConnection();

	con.query('INSERT INTO TEST_TABLE(XVALUE) VALUES (\'€\')', function(err) {
		if (err) throw err;
		con.query('SELECT * FROM TEST_TABLE', function(err, qres) {
			if (err) throw err;

			new Promise((resolve, reject) => {
				let results = [];
				qres.fetch(1, true, rowCallback, eofCallback);

				function rowCallback(row) {
					results.push(row);
				}

				function eofCallback(err) {
					if (err) {
						return reject(err);
					}
					resolve(results);
				}
			}).then((data)=>{

				console.log('inTransaction ' + con.inTransaction);
				console.log(data)
				console.log('Commit will run in ' + t +' ms ');
				setTimeout(function(){

					try {
						console.log('Request commit sync')
						con.commitSync();
						exitDelay();
					} catch (err){
						console.log(err);
					}


				},t)
			})
			.catch((err)=>{
					console.log(err);
					con.disconnect();
			})
		})
	})
}

if (c == 7) {
	let con = createConnection();
	con.query('SELECT * FROM TEST_TABLE', function(err, qres) {
		if (err) throw err;

		console.log('...')

		new Promise((resolve, reject) => {
			let results = [];
			qres.fetch(1, true, rowCallback, eofCallback);

			function rowCallback(row) {
				results.push(row);
			}

			function eofCallback(err) {
				if (err) {
					return reject(err);
				}
				resolve(results);
			}
		}).then((data)=>{

			console.log('inTransaction ' + con.inTransaction);
			console.log(data)
			let msg = JSON.stringify({key: 10 + data[0].XVALUE});
			console.log(msg);
			require('fs').writeFileSync('./test.txt', msg);
			console.log('XVALUE is', Buffer.from(data[0].XVALUE,'utf8'));
			console.log('Commit will run in ' + t +' ms ');
			setTimeout(function(){
				try {
					console.log('Request commit sync')
					con.commitSync();
					exitDelay();
				} catch (err){
					console.log(err);
				}


			},t)
		})
		.catch((err)=>{
			console.log(err);
			con.disconnect();
		})
	})

}



process.on('uncaughtException', (err) => {
  require('fs').writeSync(1, `Caught exception: ${err}\n`);
});
