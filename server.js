var express = require('express')
var bcrypt = require('bcrypt-nodejs')
var bodyparser = require('body-parser')

var _ = require('underscore')
var db = require('./db.js')
var app = express();
var middleware = require('./middleware.js')(db);
var PORT = process.env.PORT || 3000;

var todos = []
var todoNextId = 1
app.use(bodyparser.json());
app.get('/', function (req, res) {
    res.send('Todo API Root')
})
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var query = req.query;
    var where = {
        userId: req.user.get('id')
    };
    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false
    }
    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            $like: '%' + query.q + '%'
        }
    }
    db.todo.findAll({
        where: where
    }).then(function (todos) {
        res.json(todos)
    }, function (e) {
        res.status(500).json(e)
    })

})
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoid = parseInt(req.params.id, 10);
    db.todo.findOne({
        where: {
            id: todoid,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (!!todo) {
            res.json(todo.toJSON())
        } else {
            res.status(404).send()
        }
    }, function (e) {
        res.status(500).send()
    })

})

app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed')
    db.todo.create(body).then(function (todo) {
        req.user.addTodo(todo).then(function () {
            return todo.reload()
        }).then(function (todo) {
            res.json(todo.toJSON())
        })

    }, function (e) {
        res.status(404).json(e)
    }).catch(function (e) {
        console.log(e)
    })

})

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoid = parseInt(req.params.id, 10);
    db.todo.destroy({
        where: {
            id: todoid,
            userId : req.user.get('id')
        }
    }).then(function (rowDeleted) {
        if (rowDeleted === 0) {
            res.status(404).json('no record deleted')
        } else {
            res.status(204).send()
        }
    }, function () {
        res.status(500).send()
    })

})

app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoid = parseInt(req.params.id, 10)

    var body = _.pick(req.body, 'description', 'completed')
    var attributes = {};


    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }
    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }
    db.todo.findOne({
        where: {
            id: todoid,
            userId : req.user.get('id')
        }
    }).then(function (todo) {
        if (todo) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON())
            }, function (e) {
                res.status(400).json(e)
            })
        } else {
            res.status(404).send()
        }
    }, function () {
        res.status(500).send()
    })
})
app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password')
    db.user.create(body).then(function (user) {
        res.json(user.toPublicJSON())
    }, function (e) {
        res.status(404).json(e)
    }).catch(function (e) {
        console.log(e)
    })
})
app.delete('/users/login', middleware.requireAuthentication, function (req, res){
    req.token.destroy().then(function(){
        res.status(200).send()
    }).catch( function () {
        res.status(500).send()
    })
})
app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password')
    var userInstance;
    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authentication');
        userInstance = user;
        return db.token.create({
            token : token
        })
       
    }).then(function(tokenInstance){
        res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON())
    }).catch( function () {
        res.status(401).send()
    })

})
db.sequalize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('server running on ' + PORT)
    })

})
