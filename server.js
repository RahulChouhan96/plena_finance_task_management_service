const express = require("express");
const mongoose = require("mongoose");

const Task = require("./taskModel");


let app = express();


app.use(express.json());


async function validateIsUserAdmin(userId) {
    // Here, we can call user service API: GET /user/validate/admin
    // validateAdminByUserService(userId)

    // For now, I'm just simulating it
    return true;
}


app.post("/task_management/admin/task", async (req, res) => {
    try {
        const validateReqUser = await validateIsUserAdmin(req.body.reqUserId);
        if (!validateReqUser) {
            res.status(404).json({ "message": "Not allowed!" });
            return;
        }

        req.body.taskData.dueDate = new Date(req.body.taskData.dueDate);
        await new Task(req.body.taskData).save();
        res.status(200).json({ "message": "Task created successfully!" });
    }
    catch(e) {
        console.log("Error = ", e);
        res.status(500).json({ "message": "Some error occured = " + e });
    }
});


app.put("/task_management/admin/task", async (req, res) => {
    const validateReqUser = await validateIsUserAdmin(req.body.reqUserId);
    if (!validateReqUser) {
        res.status(404).json({ "message": "Not allowed!" });
        return;
    }

    try {
        await Task.findByIdAndUpdate(req.body.taskData._id, req.body.taskData);
        res.status(200).json({ "message": "Task updated successfully!" });
    }
    catch(e) {
        console.log("Error = ", e);
        res.status(500).json({ "message": "Some error occured = " + e });
    }
});


app.get("/task_management/admin/search/task", async (req, res) => {
    const validateReqUser = await validateIsUserAdmin(req.query.reqUserId);
    if (!validateReqUser) {
        res.status(404).json({ "message": "Not allowed!" });
        return;
    }

    try {
        let tasks = await Task.find({ "$text": { "$search": req.query.searchText } });
        tasks.sort((task1, task2) => {
            if (task1.completionStatus != task2.completionStatus)
                return task1.completionStatus === "PROGRESS" ? -1 : 1

            if (task1.dueDate != task2.dueDate)
                return (task1.dueDate < task2.dueDate) ? -1 : 1;

            const priorityMap = {
                "HIGH": 1,
                "MEDIUM": 2,
                "LOW": 3
            }
            return priorityMap[task1.priority] - priorityMap[task2.priority]
        });
        res.status(200).json(tasks);
    }
    catch(e) {
        console.log("Error = ", e);
        res.status(500).json({ "message": "Some error occured = " + e });
    }
});


app.get("/task_management/task", async (req, res) => {
    try {
        const taskData = await Task.findById(req.query.taskId);
        res.status(200).json(taskData);
    }
    catch(e) {
        console.log("Error = ", e);
        res.status(500).json({ "message": "Some error occured = " + e });
    }
});


app.put("/task_management/task/done", async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.body.taskId, { "$set": { completionStatus: "DONE" } });
        // Here, we can release an SQS event
        // Or maybe we can use any other desirable service to release an event
        res.status(200).json({ "message": "Task successfully marked as Done!" });
    }
    catch(e) {
        console.log("Error = ", e);
        res.status(500).json({ "message": "Some error occured = " + e });
    }
});


mongoose.connect("mongodb://127.0.0.1:27017/plena_finance", {
    useNewUrlParser:true
});

let conn = mongoose.connection;
conn.on('error', (error) => {
    console.log("Error while connecting with MongoDB!", error);
});

conn.once('open', () => {
    console.log("MongoDB Connected successfully!");
});


app.listen(8080, () => {
    console.log("Server running at 8080!");
})