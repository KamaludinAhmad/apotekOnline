const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const session = require('express-session');
const app = express()

const secretKey = 'thisisverysecretkey'

app.listen(3000, () => {
    console.log('App is running on port 3000')
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'Apotek'
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

connection.connect((err) => {
    if (err) throw err
    console.log('Database connected')
})

const isAuthorized = (request, result, next) => {
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }
    let token = request.headers['x-api-key']
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })
    next()
}

app.get('/', (request, result) => {
    result.json({
        success: true,
        message: 'Dirumah aja ya'
    })
})

app.post('/login/admin', (request, result) => {
    let data = request.body

    if (data.username == 'admin' && data.password == 'admin') {
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        result.json({
            success: true,
            message: 'Login sukses!',
            token: token
        })
    }

    result.json({
        success: false,
        message: 'Username / Password Salah!'
    })
})

app.post('/login/user', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {

		connection.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/shoe');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});
// create data
app.get('/barang',  (req, res) => {
    let sql = `
        select * from barang
    `

    connection.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success retrive data from database',
            data: result
        })
    })
})

// create data
app.post('/barang', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        insert into barang (jenis_barang, nama_barang, harga)
        values ('`+data.jenis_barang+`', '`+data.nama_barang+`', '`+data.harga+`');
    `

    connection.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data barang telah ditambahkan'
    })
})