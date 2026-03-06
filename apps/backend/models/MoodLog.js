const mongoose = require('mongoose');
const { getMaxListeners } = require('./User');

const MoodeLogSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

    moodScore:{
        type:Number,
        required:true,
        min:1,
        max:10,
    },

    notes:{
        type:String,
        trim:true,
        maxlength:500,
    },

    emotions:[{
        type:String,

    }]


},{timeStamps:true});

module.exports = mongoose.model('MoodLog',MoodeLogSchema);