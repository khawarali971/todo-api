var express = require('express')
var bodyparser = require('body-parser')
var _ = require('underscore')
var db = require('./db.js')
var app = express();
var PORT = process.env.PORT || 3000;
var todos = []
var todoNextId = 1
app.use(bodyparser.json());
app.get('/', function (req, res) {
    res.send('Todo API Root')
})
app.get('/todos', function (req, res) {
    var filteredtools = todos;
    var queryparams = req.query;
    if (queryparams.hasOwnProperty('completed') && queryparams.completed === 'true') {
        filteredtools = _.where(filteredtools, {
            completed: true
        })

    } else if (queryparams.hasOwnProperty('completed') && queryparams.completed === 'false') {
        filteredtools = _.where(filteredtools, {
            completed: false
        })
    }
    if (queryparams.hasOwnProperty('q') && queryparams.q.length > 0) {
        filteredtools = _.filter(filteredtools, function (todo) {
            return todo.description.toLowerCase().indexOf(queryparams.q.toLowerCase()) > -1;
        })
    }
    res.json(filteredtools)
})
app.get('/todos/:id', function (req, res) {
    var todoid = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {
        id: todoid
    })

    if (matchedTodo) {
        res.json(matchedTodo)
    } else {
        res.status(404).send();
    }
})

app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed')
    db.todo.create(body).then(function (todo) {
            res.json(todo.toJSON())
        }, function (e) {
            res.status(404).json(e)
        }).catch(function(e){
        console.log(e)
    })
        /*if (!_.isString(body.description) || !_.isBoolean(body.completed) || body.description.trim().length === 0) {
            return res.status(400).send();
        }
        body.description = body.description.trim()
        body.id = todoNextId++
            todos.push(body)
        res.json(body)*/
})
app.delete('/todos/:id', function (req, res) {
    var todoid = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {
        id: todoid
    })
    if (matchedTodo) {
        todos = _.without(todos, matchedTodo);
        //res.status(200).json('deleted id ' + todoid);
        res.json(matchedTodo)
    } else {
        res.status(404).json('error: todo id not found');
    }

})

app.put('/todos/:id', function (req, res) {
    var todoid = parseInt(req.params.id, 10)
    var matchtodo = _.findWhere(todos, {
        id: todoid
    })
    var body = _.pick(req.body, 'description', 'completed')
    var validattributes = {};
    if (!matchtodo) {
        res.send(404).send();
    }


    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validattributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        res.send(400).send();
    }
    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validattributes.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        res.send(400).send();
    }
    _.extend(matchtodo, validattributes)
    res.json(matchtodo)
})
db.sequalize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('server running on ' + PORT)
    })

})
