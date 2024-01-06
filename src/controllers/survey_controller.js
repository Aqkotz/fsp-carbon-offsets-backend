import Survey from '../models/survey_model';
import axios from 'axios';

export const getSurveys = async (req, res) => {
    try {
        const surveys = await Survey.find({});
        return res.json(surveys);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const getSurvey = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        return res.json(survey);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const createSurvey = async (req, res) => {
    try {
        const survey = await Survey.create(req.body);
        return res.json(survey);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const updateSurvey = async (req, res) => {
    try {
        const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.json(survey);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const getCarbonFootprint = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        const response = await axios.post('https://api.myc-staging.org/v1/footprint_calculators.json', survey.toJSON());
        const responseData = response.data;

        // Return the response data
        return res.json(responseData);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const deleteSurvey = async (req, res) => {
    try {
        const survey = await Survey.findByIdAndRemove(req.params.id);
        return res.json(survey);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

