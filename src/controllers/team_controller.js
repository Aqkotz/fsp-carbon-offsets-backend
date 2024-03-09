import Team from '../models/team_model';
import User from '../models/user_model';
import { updateUserCarbonFootprint } from './user_controller';

export const getTeamAndUpdate = async (userId) => {
  const user = await User.findById(userId);
  let team = await Team.findById(user.team);
  if (!team) {
    return null;
  }
  if (team.carbonFootprint_isStale) {
    console.log(`Updating carbon footprint for team ${team.name}...`);
    await updateTeamCarbonFootprint(team);
    team = await Team.findById(user.team);
  }
  if (team.leaderboard_isStale) {
    console.log(`Updating leaderboard for team ${team.name}...`);
    await updateLeaderboardForTeam(team);
    team = await Team.findById(user.team);
  }
  return team;
};

export const createTeam = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id);
    const team = new Team({
      ...req.body,
      members: [owner._id],
      admins: [owner._id],
      owner: owner._id,
      joinCode: Math.random().toString(36).substring(2, 7).toUpperCase(),
    });
    owner.team = team._id;
    owner.adminOf = team._id;
    await owner.save();
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
    if (team.members.includes(user._id)) {
      return res.status(400).json({ error: 'User is already on team' });
    }
    team.members.push(user._id);
    team.carbonFootprint_isStale = true;
    team.leaderboard_isStale = true;
    user.team = team._id;
    await team.save();
    await user.save();
    const t = await getTeamAndUpdate(req.user._id);
    return res.json(t);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (team.owner.equals(user._id)) {
      return res.status(400).json({ error: 'Owner cannot leave team' });
    }
    team.members.pull(user.id);
    team.admins.pull(user.id);
    team.carbonFootprint_isStale = true;
    user.team = null;
    user.adminOf = null;
    await team.save();
    await user.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const transferOwnership = async (req, res) => {
  try {
    const { newOwner } = req.body;
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.admins.includes(newOwner)) {
      return res.status(400).json({ error: 'New owner is not an admin' });
    }
    team.owner = newOwner;
    await team.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { newAdmin } = req.body;
    const admin = await User.findById(newAdmin);
    if (!admin) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.members.includes(newAdmin)) {
      return res.status(400).json({ error: 'New admin is not a member' });
    }
    admin.adminOf = team._id;
    team.admins.push(newAdmin);
    await team.save();
    await admin.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { oldAdmin } = req.body;
    const admin = await User.findById(oldAdmin);
    if (!admin) {
      return res.status(400).json({ error: 'User not found' });
    }
    const team = await getTeamAndUpdate(oldAdmin);
    if (!team.admins.includes(req.user._id)) {
      return res.status(400).json({ error: 'Remover is not an admin' });
    }
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.admins.includes(oldAdmin)) {
      return res.status(400).json({ error: 'Target is not an admin' });
    }
    if (team.owner.equals(oldAdmin)) {
      return res.status(400).json({ error: 'Owner cannot be removed' });
    }
    team.admins.pull(oldAdmin);
    admin.adminOf = null;
    await team.save();
    await admin.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    await team.populate('members');
    if (!team.owner.equals(user._id)) {
      return res.status(400).json({ error: 'User is not the owner' });
    }
    await Promise.all(team.members.map(async (member) => {
      member.team = null;
      member.adminOf = null;
      return member.save();
    }));
    await Team.findByIdAndDelete(team._id);
    return res.json({ message: 'Team deleted' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const team = await Team.findById(user.team);
    // const team = await getTeamAndUpdate(req.user._id);
    if (!team) {
      console.log('Team not found');
      return null;
    }
    await team.populate('members');
    console.log('Team: ', team);
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

export async function updateTeamCarbonFootprint(team) {
  try {
    await team.populate('members');
    await Promise.all(team.members.map(async (user) => {
      if (user.carbonFootprint_isStale) {
        console.log(`Updating carbon footprint for user ${user.name}...`);
        return updateUserCarbonFootprint(await user.populate('trips'));
      }
      return Promise.resolve();
    }));

    team.members.forEach((member) => {
      console.log('member: ', member);
    });

    const categories = ['weekly', 'allTime', 'reduction'];
    const types = ['travel', 'food', 'house'];

    const newCarbonFootprint = {
      weekly: { total: 0 },
      allTime: { total: 0 },
      reduction: { total: 0 },
    };

    categories.forEach((category) => {
      types.forEach((type) => {
        newCarbonFootprint[category][type] = team.members.reduce((total, user) => {
          return total + user.carbonFootprint[category][type];
        }, 0);
        newCarbonFootprint[category].total += newCarbonFootprint[category][type];
      });
    });

    team.carbonFootprint = newCarbonFootprint;
    team.carbonFootprint_isStale = false;

    await team.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error;
  }
}

export async function setAllTeamsStale() {
  try {
    const teams = await Team.find({});
    await Promise.all(teams.map(async (team) => {
      team.carbonFootprint_isStale = true;
      team.leaderboard_isStale = true;
      return team.save();
    }));
  } catch (error) {
    console.error('Failed to set all teams stale: ', error);
    throw error;
  }
}

export async function updateLeaderboardForTeam(team) {
  try {
    await team.populate('members');
    const leaderboard = team.members.map((member) => {
      return {
        name: member.name,
        userId: member._id,
        carbonReduction: member.carbonFootprint.reduction.total,
      };
    });
    leaderboard.sort((a, b) => { return b.carbonReduction - a.carbonReduction; });
    leaderboard.splice(10);
    team.leaderboard = leaderboard;
    team.leaderboard_isStale = false;
    await team.save();
  } catch (error) {
    console.error('Failed to update leaderboard: ', error);
    throw error;
  }
}

export async function testRequest(req, res) {
  try {
    const team = await getTeamAndUpdate(req.user._id);
    if (team) {
      await team.populate('members');
    }
    return res.json(team);
  } catch (error) {
    console.error('Failed to test request: ', error);
    return res.status(400).json({ error: error.message });
  }
}
