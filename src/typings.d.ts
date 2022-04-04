export interface overbuffData {
  data: {
    games: [
      {
        custom_game: boolean;
        duration: number;
        end_sr: null | number;
        game_type: string;
        game_version: string;
        heroes_played: [Array<string, number>];
        key: string;
        map: string;
        player_name: string;
        rank: string;
        result: string;
        role: string;
        score: null | number;
        season: string;
        season_index: number;
        start_sr: number;
        time: number;
        url: string;
        user_id: number;
        viewable: boolean;
      }
    ];
    last_evaluated_key: null | number;
    seasons: string[];
  };
}
