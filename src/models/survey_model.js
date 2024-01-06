import mongoose from 'mongoose';

const SurveySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    submitted: { type: Boolean, default: false },
    mobility_vehicles: { type: String, enum: ['low', 'medium', 'high', 'giant'] },
    mobility_flight: { type: String, enum: ['low', 'medium', 'high', 'giant'] },
    consumption_food: { type: String, enum: ['low', 'medium', 'high', 'giant'] },
    consumption_shopping: { type: String, enum: ['low', 'medium', 'high', 'giant'] },
    household_area: { type: String, enum: ['low','high'] },
    household_building: { type: String, enum: ['low','high'] },
    household_heating: { type: String, enum: ['low','high'] },
});

SurveySchema.methods.toJSON = function () {
    const survey = this;
    const surveyObject = survey.toObject();

    delete surveyObject._id;
    delete surveyObject.__v;
    delete surveyObject.userId;
    delete surveyObject.timestamp;
    delete surveyObject.submitted;

    return surveyObject;
}

const Survey = mongoose.model('Survey', SurveySchema);

module.exports = Survey;
