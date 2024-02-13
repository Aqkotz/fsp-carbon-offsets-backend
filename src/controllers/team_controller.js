import Team from '../models/team_model';
import User from '../models/user_model';

export const createTeam = async (req, res) => {
  try {
    const team = new Team(req.body);
    team.joinCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    await team.save();
    return res.status(201).json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const joinTeam = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const user = await User.findById(req.user._id);
    const team = await Team.findOne({ joinCode });
    if (!team) {
      return res.status(400).json({ error: 'Team not found' });
    }
    team.members.push(user.id);
    user.team = team;
    await team.save();
    await user.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('team');
    return res.json(user.team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getJoinCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('adminOf');
    const team = user.adminOf;
    if (!team) {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    console.log(team.joinCode);
    return res.json(team.joinCode);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export async function updateCarbonFootprint(team) {
  try {
    // Update carbon footprints for all trips
    await Promise.all(team.members.map(async (user) => {
      if (user.carbonFootprint_isStale) {
        return User.updateCarbonFootprint(await user.populate('trips'));
      }
      return Promise.resolve();
    }));

    team.carbonFootprint = team.members
      .reduce((total, user) => { return total + user.carbonFootprint; }, 0);

    team.carbonFootprint_isStale = false;
    await team.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function getCarbonFootprint(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const { teamId } = req.params;
    let team = await Team.findById(teamId).populate('members');
    if (!team.members.map((member) => { return member.id; }).includes(user.id)) {
      return res.status(400).json({ error: 'User not in team' });
    }
    if (team.carbonFootprint_isStale) {
      console.log(`Updating carbon footprint for team ${team.name}...`);
      await updateCarbonFootprint(team);
      team = await Team.findById(req.user._id);
    }
    return res.json(team.carbonFootprint);
  } catch (error) {
    console.error('Failed to get carbon footprint: ', error);
    return res.status(400).json({ error: error.message });
  }
}
