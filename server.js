const args = require('minimist')(process.argv.slice(2))
args['port', 'debug', 'log', 'help']



const port = args.port || process.env.PORT || 5555

const help = args.help
const debug = args.debug
const log = args.log

if(help){
  console.log(`  
--port	    Set the port number for the server to listen on. Must be an integer
          between 1 and 65535.

--debug     If set to \`true\`, creates endlpoints /app/log/access/ which returns
          a JSON access log from the database and /app/error which throws 
          an error with the message "Error test successful." Defaults to 
         \`false\`.

--log       If set to false, no log files are written. Defaults to true.
          Logs are always written to database.

--help	  Return this message and exit.`)
  process.exit(0)
}

const express = require('express')
const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = require('./database.js')

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
})

// For logging
if(log){
  var logger = require('morgan');

  app.use(logger('common', {
      stream: fs.createWriteStream('./access.log', {flags: 'a'})
  }));
}

app.use((req, res, next) => {
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    secure: req.secure,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = db.prepare(`INSERT INTO accesslog 
  ( remoteaddr, 
    remoteuser,
    time,
    method,
    url,
    protocol,
    httpversion,
    secure,
    status,
    referer,
    useragent )
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method,
      logdata.url, logdata.protocol, logdata.httpversion, logdata.secure, logdata.status, 
      logdata.referer, logdata.useragent)
    res.status(200)
})

app.get('/app', (req, res) => {
  res.status(200)
  res.json({"message": "API workds (200)"})
});

if(debug){
  app.get('/app/log/access', (req, res) => {
    try{
        const stmt = db.prepare('SELECT * FROM accesslog').all()
        res.status(200).json(stmt)
      } catch (e) {
            console.error(e)
    }
  })
  app.get('/app/error', (err, req, res, next) =>{
    if (res.headersSent) {
      return next(err)
    }
    res.status(500)
    res.render('error', { error: err })
  })
}



// app.post('/app/new/user', (req, res, next) => {
//     let data = {
//       user: req.body.username,
//       pass: req.body.password
//     }
//     const stmt = db.prepare('INSERT INTO userinfo (username, password) VALUES (?,?)')
//     const info = stmt.run(data.user, data.pass)
//     res.status(200).json(info)
// })

// app.get('/app/users', (req, res) => {
//     try{
//         const stmt = db.prepare('SELECT * FROM userinfo').all()
//         res.status(200).json(stmt)
//     } catch (e) {
//         console.error(e)
// }})

// app.get('/app/users/:id', (req, res) => {
//     try{
//         const stmt = db.prepare(`SELECT * FROM userinfo WHERE id = ?`).get(req.params.id)
//         res.status(200).json(stmt)
//     } catch (e) {
//         console.error(e)
//     }
// })

// app.patch('/app/update/user/:id', (req, res) => {
//   let data = {
//     user: req.body.username,
//     pass: req.body.password
//   }
//   const stmt = db.prepare('UPDATE userinfo SET username = COALESCE(?,username), password = COALESCE(?,password) WHERE id = ?')
//   const info = stmt.run(data.user, data.pass, req.params.id)
//   res.status(200).json(info)
// })

// app.delete('/app/delete/user/:id', (req, res) => {
//     const stmt = db.prepare('DELETE FROM userinfo WHERE id = ?')
//     const info = stmt.run(req.params.id)
//     res.status(200).json(info)
// })

app.use(function(req, res){
    res.status(404)
    res.json({"message":"Endpoint not found (404)"})
})