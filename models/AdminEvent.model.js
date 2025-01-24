const mongoose = require("mongoose");

const AdminEventSchema = new mongoose.Schema({
    degreeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Degree',
        required: true,
      },

    title : {
        type : String,
        required : [true , "Event title is required"],
    },

    description : {
        type: String,
        required : [true, "Description is required"],
    },

    startDate : {
        type : Date,
        required : [true, "Start Date is required"],
    },

    endDate : {
        type : Date,
        required : [true, "End Date is required"],
    }
});

const AdminEvent = mongoose.model("AdminEvent", AdminEventSchema);

module.exports = AdminEvent;