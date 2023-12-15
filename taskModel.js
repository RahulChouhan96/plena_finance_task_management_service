const mongoose = require("mongoose");


const Schema = mongoose.Schema;


const TaskSchema = new Schema({
    title: String,
    description: String,
    priority: String,
    dueDate: Date,
    completionStatus: String
});

TaskSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Task", TaskSchema);