var express = require('express')
var bodyparser = require('body-parser')
var _ = require('underscore')
var app = express();
var PORT = process.env.PORT || 3000;
var todos = []
var todoNextId = 1
app.use(bodyparser.json());
app.get('/', function (req, res) {
    res.send('Todo API Root')
})
app.get('/todos', function (req, res) {
    res.json(todos)
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
    if (!_.isString(body.description) || !_.isBoolean(body.completed) || body.description.trim().length === 0) {
        return res.status(400).send();
    }
    body.description = body.description.trim()
    body.id = todoNextId++
        todos.push(body)
    res.json(body)
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
app.listen(PORT, function () {
    console.log('server running on ' + PORT)
})
