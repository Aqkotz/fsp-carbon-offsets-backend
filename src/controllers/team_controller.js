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
    team.members.push(user._id);
    team.carbonFootprint_isStale = true;
    user.team = team._id;
    await team.save();
    await user.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const team = await Team.findById(user.team);
    team.members.pull(user.id);
    team.carbonFootprint_isStale = true;
    user.team = null;
    await team.save();
    await user.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let team = await Team.findById(user.team);
    if (!team) {
      return res.json(null);
    }
    if (team.carbonFootprint_isStale) {
      console.log(`Updating carbon footprint for team ${team.name}...`);
      await updateCarbonFootprint(await team.populate('members'));
      team = await Team.findById(user.team);
    }
    return res.json(team);
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
        console.log(`Updating carbon footprint for user ${user.name}...`);
        return User.updateCarbonFootprint(await user.populate('trips'));
      }
      return Promise.resolve();
    }));

    console.log(team.members);

    team.carbonFootprint = team.members
      .reduce((total, user) => { return total + user.carbonFootprint; }, 0);

    await team.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error;
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
    if (team.carbonFootprint_isStale || team.members.any((member) => { return member.carbonFootprint_isStale; })) {
      console.log(`Updating carbon footprint for team ${team.name}...`);
      await updateCarbonFootprint(team);
      team = await Team.findById(teamId);
    }
    return res.json(team.carbonFootprint);
  } catch (error) {
    console.error('Failed to get carbon footprint: ', error);
    return res.status(400).json({ error: error.message });
  }
}
