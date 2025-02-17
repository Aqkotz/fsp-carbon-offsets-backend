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

const setUserAdmin = async (adminId) => {
  const admin = await User.findById(adminId);
  const team = await getTeamAndUpdate(admin._id);
  admin.adminOf = team._id;
  team.admins.push(admin._id);
  await team.save();
  await admin.save();
  return team;
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
    if (team.admins.includes(newAdmin)) {
      return res.status(400).json({ error: 'New admin is already an admin' });
    }
    await setUserAdmin(newAdmin);
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
      await setUserAdmin(newOwner);
    }
    team.owner = newOwner;
    await team.save();
    return res.json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(400).json({ error: 'User not found' });
    }
    const team = await getTeamAndUpdate(admin._id);
    if (!team.admins.includes(req.user._id)) {
      return res.status(400).json({ error: 'Remover is not an admin' });
    }
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.admins.includes(admin._id)) {
      return res.status(400).json({ error: 'Target is not an admin' });
    }
    if (team.owner.equals(admin._id)) {
      return res.status(400).json({ error: 'Owner cannot be removed' });
    }
    team.admins.pull(admin._id);
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

export const regenerateJoinCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.admins.includes(user._id)) {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    team.joinCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    await team.save();
    return res.json(team.joinCode);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const team = await getTeamAndUpdate(req.user._id);
    if (!team) {
      return null;
    }
    await team.populate('members');
    const teamData = team.toObject();
    teamData.teamGoal = { ...teamData.teamGoal, actualCarbonReduction: teamData.carbonFootprint.weeklyReduction.total };
    return res.json(teamData);
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

    const categories = ['weekly', 'allTime', 'reduction', 'weeklyReduction'];
    const types = ['travel', 'food', 'house'];

    const newCarbonFootprint = {
      weekly: { total: 0 },
      allTime: { total: 0 },
      reduction: { total: 0 },
      weeklyReduction: { total: 0 },
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
    team.teamSize = team.members.length;
    await team.save();
  } catch (error) {
    console.error('Failed to update leaderboard: ', error);
    throw error;
  }
}

export async function testRequest(req, res) {
  try {
    const team = await getTeamAndUpdate(req.user._id);
    let teamData = null;
    if (team) {
      await team.populate('members');
      teamData = team.toObject();
      teamData.teamGoal = { ...teamData.teamGoal, actualCarbonReduction: teamData.carbonFootprint.weeklyReduction.total };
    }
    return res.json(teamData);
  } catch (error) {
    console.error('Failed to test request: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function setTeamGoal(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const team = await getTeamAndUpdate(user._id);
    const { goal } = req.body;
    if (!team) {
      return res.status(400).json({ error: 'User is not on a team' });
    }
    if (!team.admins.includes(user._id)) {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    goal.startDate = startOfWeek;
    goal.endDate = endOfWeek;
    team.teamGoal = goal;
    await team.save();
    return res.json(team);
  } catch (error) {
    console.error('Failed to set team goal: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function setTeamGoalsPast() {
  try {
    const teams = await Team.find({});
    await Promise.all(teams.map(async (team) => {
      if (team.teamGoal) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today > team.teamGoal.endDate) {
          // This only works because we don't update the team once it has been set stale. Bad practice. Fix in the future.
          team.pastTeamGoals.push({ ...team.teamGoal, actualCarbonReduction: team.carbonFootprint.weeklyReduction.total });
          team.teamGoal = null;
          await team.save();
        }
      }
    }));
  } catch (error) {
    console.error('Failed to set past team goals: ', error);
    throw error;
  }
}
