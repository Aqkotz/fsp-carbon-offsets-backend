import Team from '../models/team_model';
import User from '../models/user_model';
import { updateUserCarbonFootprint } from './user_controller';

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
      await updateTeamCarbonFootprint(await team.populate('members'));
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

export async function updateTeamCarbonFootprint(team) {
  try {
    // Update carbon footprints for all trips
    await Promise.all(team.members.map(async (user) => {
      if (user.carbonFootprint_isStale) {
        console.log(`Updating carbon footprint for user ${user.name}...`);
        return updateUserCarbonFootprint(await user.populate('trips'));
      }
      return Promise.resolve();
    }));

    const newCarbonFootprint = {
      weekly: {},
      allTime: {},
    };

    newCarbonFootprint.weekly.travel = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.weekly.travel; }, 0);
    newCarbonFootprint.weekly.food = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.weekly.food; }, 0);
    newCarbonFootprint.weekly.house = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.weekly.house; }, 0);

    newCarbonFootprint.allTime.travel = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.allTime.travel; }, 0);
    newCarbonFootprint.allTime.food = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.allTime.food; }, 0);
    newCarbonFootprint.allTime.house = team.members
      .reduce((total, user) => { return total + user.carbonFootprint.allTime.house; }, 0);

    newCarbonFootprint.weekly.total = newCarbonFootprint.weekly.travel + newCarbonFootprint.weekly.food + newCarbonFootprint.weekly.house;
    newCarbonFootprint.allTime.total = newCarbonFootprint.allTime.travel + newCarbonFootprint.allTime.food + newCarbonFootprint.allTime.house;
    team.carbonFootprint = newCarbonFootprint;

    await team.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error;
  }
}

export async function getCarbonFootprint(req, res) {
  try {
    const user = await User.findById(req.user._id);
    let team = await Team.findById(user.team).populate('members');
    if (!team) {
      return res.status(400).json({ error: 'User not in team' });
    }
    if (!team.members.map((member) => { return member.id; }).includes(user.id)) {
      return res.status(400).json({ error: 'User not in team' });
    }
    if (team.carbonFootprint_isStale || team.members.any((member) => { return member.carbonFootprint_isStale; })) {
      console.log(`Updating carbon footprint for team ${team.name}...`);
      await updateTeamCarbonFootprint(team);
      team = await Team.findById(user.team);
    }
    const footprint = {
      user: user.carbonFootprint,
      team: team.carbonFootprint,
    };
    return res.json(footprint);
  } catch (error) {
    console.error('Failed to get carbon footprint: ', error);
    return res.status(400).json({ error: error.message });
  }
}

// export async function updateWeeks() {
//   try {
//     const teams = await Team.find({});
//     teams.forEach((team) => {
//       team.members.forEach((member) => {
//         member.carbonFootprint_isStale = true;
//         member.save();
//       });
//       team.week += 1;
//       team.carbonFootprint_isStale = true;
//       team.save();
//     });
//   } catch (error) {
//     console.log(error);
//   }
// }

export function weekForTeam(team) {
  return Math.floor((Date.now() - team.startDate) / (1000 * 60 * 60 * 24 * 7)) + 1;
}

export function programDurationDays(team) {
  return Math.floor((Date.now() - team.startDate) / (1000 * 60 * 60 * 24));
}
