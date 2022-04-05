import config from "./config";

export default {
  overTrackURL:
    "https://api2.overtrack.gg/overwatch/games/" + config.overtrackShareLink,
  redisPrefix: "otb:",
  mockData: {
    data: {
      games: [
        {
          custom_game: false,
          duration: 920,
          end_sr: null,
          game_type: "competitive",
          game_version: "2.6.2",
          heroes_played: [["s76", 1]],
          key: "C3AGLE-1342/123123123123123123123123123123123123123123-04-04-01-58-7xts2G",
          map: "Rialto",
          player_name: "C3AGLE",
          rank: "silver",
          result: "UNKNOWN",
          role: "support",
          score: null,
          season: "Season 33",
          season_index: 33,
          start_sr: 1708,
          time: 1649037488,
          url: "https://overtrack-parsed-games.s3.amazonaws.com/C3AGLE-1342/2022-04-04-01-58-7xts2G/game.json",
          user_id: -923494497,
          viewable: true,
        },
      ],
      last_evaluated_key: null,
      seasons: ["Season 33"],
    },
  },
};
