const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
let database;

const initializeAndServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryyAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryyAndpriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  const { search_q = "", priority, status, category } = request.query;
  let getTodoQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodoQuery = `
      SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryyAndStatus(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodoQuery = `
        SELECT * FROM todo WHERE category='${category}' AND status='${status}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryyAndpriority(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
          getTodoQuery = `
        SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
          data = await database.all(getTodoQuery);
          response.status(200);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        getTodoQuery = `
      SELECT * FROM todo WHERE priority='${priority}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status("400");
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
        getTodoQuery = `
        SELECT * FROM todo WHERE status='${status}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasSearchProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodoQuery);
      response.send(data.map((each) => outPutResult(each)));

      break;

    case hasCategoryProperty(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        getTodoQuery = `
      SELECT * FROM todo WHERE category='${category}'`;
        data = await database.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    default:
      getTodoQuery = `SELECT * FROM todo`;
      data = await database.all(getTodoQuery);
      response.send(data.map((each) => outPutResult(each)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const gettodoQuery = `
  SELECT * FROM todo WHERE id=${todoId}`;
  const data = await database.get(gettodoQuery);
  response.send(outPutResult(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `
    SELECT * FROM todo WHERE due_date='${newDate}';`;
    const responseResult = await database.all(requestQuery);
    response.send(responseResult.map((each) => outPutResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
    if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postnewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `
          INSERT INTO todo(id,todo,priority,status,category,due_date)
          VALUES(${id},'${todo}','${priority}','${status}','${category}','${postnewDate}');`;
          await database.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updatedTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
        updatedTodoQuery = `
        UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
        WHERE id=${todoId}`;
        await database.run(updatedTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        updatedTodoQuery = `
        UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
        WHERE id=${todoId}`;
        await database.run(updatedTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.category !== undefined:
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        updatedTodoQuery = `
        UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
        WHERE id=${todoId}`;
        await database.run(updatedTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.todo !== undefined:
      updatedTodoQuery = `
        UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
        WHERE id=${todoId}`;
      await database.run(updatedTodoQuery);
      response.send("Todo Updated");

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updatedTodoQuery = `
        UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${newDate}'
        WHERE id=${todoId}`;
        await database.run(updatedTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE from todo WHERE id=${todoId}`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
