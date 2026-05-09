use super::fps_tracer;
use super::{MetricProvider, MetricValue};
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::System;

const KNOWN_GAMES: &[(&str, &str)] = &[
    // Valve / Source
    ("cs2", "Counter-Strike 2"),
    ("csgo", "CS:GO"),
    ("dota2", "Dota 2"),
    ("hl2", "Half-Life 2"),
    ("left4dead2", "Left 4 Dead 2"),
    ("portal2", "Portal 2"),
    ("deadlock", "Deadlock"),
    // Shooters
    ("valorant", "Valorant"),
    ("valorant-win64-shipping", "Valorant"),
    ("fortnite", "Fortnite"),
    ("fortniteclient-win64-shipping", "Fortnite"),
    ("apex_legends", "Apex Legends"),
    ("r5apex", "Apex Legends"),
    ("overwatch", "Overwatch"),
    ("destiny2", "Destiny 2"),
    ("cod", "Call of Duty"),
    ("modernwarfare", "Call of Duty MW"),
    ("blackops", "Call of Duty BO"),
    ("rainbow6", "Rainbow Six Siege"),
    ("rainbowsix", "Rainbow Six Siege"),
    ("r6-siege", "Rainbow Six Siege"),
    ("thefinals", "The Finals"),
    ("discoveryalpha-win64-shipping", "The Finals"),
    ("pubg", "PUBG"),
    ("tslgame", "PUBG"),
    ("escape_from_tarkov", "Escape from Tarkov"),
    ("escapefromtarkov", "Escape from Tarkov"),
    ("battlefield", "Battlefield"),
    ("bf2042", "Battlefield 2042"),
    ("halo", "Halo Infinite"),
    ("haloinfinite", "Halo Infinite"),
    ("titanfall2", "Titanfall 2"),
    ("splitgate", "Splitgate"),
    ("huntshowdown", "Hunt: Showdown"),
    ("hunt", "Hunt: Showdown"),
    ("deadbydaylight-win64-shipping", "Dead by Daylight"),
    // Open world / RPG
    ("gta5", "GTA V"),
    ("gtav", "GTA V"),
    ("rdr2", "Red Dead Redemption 2"),
    ("cyberpunk2077", "Cyberpunk 2077"),
    ("eldenring", "Elden Ring"),
    ("baldursgate3", "Baldur's Gate 3"),
    ("bg3", "Baldur's Gate 3"),
    ("hogwartslegacy", "Hogwarts Legacy"),
    ("starfield", "Starfield"),
    ("fallout4", "Fallout 4"),
    ("skyrim", "Skyrim"),
    ("tesv", "Skyrim"),
    ("witcher3", "The Witcher 3"),
    ("witcher", "The Witcher"),
    ("acvalhalla", "AC Valhalla"),
    ("acodyssey", "AC Odyssey"),
    ("acmirage", "AC Mirage"),
    ("assassinscreedshadows", "AC Shadows"),
    ("dragonage", "Dragon Age"),
    ("monsterhunter", "Monster Hunter"),
    ("mhrise", "Monster Hunter Rise"),
    ("darksouls", "Dark Souls"),
    ("sekiro", "Sekiro"),
    ("armoredcore", "Armored Core VI"),
    ("spiderman", "Spider-Man"),
    ("batmanarkham", "Batman Arkham"),
    ("ghostoftsushima", "Ghost of Tsushima"),
    ("horizonzerodawn", "Horizon Zero Dawn"),
    ("horizonforbiddenwest", "Horizon Forbidden West"),
    ("godofwar", "God of War"),
    // Simulation / Racing
    ("eurotrucks2", "Euro Truck Simulator 2"),
    ("eurotrucks", "Euro Truck Simulator 2"),
    ("amtrucks", "American Truck Simulator"),
    ("ats", "American Truck Simulator"),
    ("msfs", "Microsoft Flight Simulator"),
    ("flightsimulator", "Microsoft Flight Simulator"),
    ("forza", "Forza"),
    ("forzahorizon", "Forza Horizon"),
    ("assettocorsa", "Assetto Corsa"),
    ("iracing", "iRacing"),
    ("beamng", "BeamNG.drive"),
    ("thecrewmotorfest", "The Crew Motorfest"),
    ("snowrunner", "SnowRunner"),
    ("farmingsimulator", "Farming Simulator"),
    // Survival / Crafting
    ("minecraft", "Minecraft"),
    ("javaw", "Minecraft (Java)"),
    ("palworld", "Palworld"),
    ("rust", "Rust"),
    ("rustclient", "Rust"),
    ("valheim", "Valheim"),
    ("terraria", "Terraria"),
    ("satisfactory", "Satisfactory"),
    ("subnautica", "Subnautica"),
    ("ark", "ARK"),
    ("shootergame", "ARK"),
    ("theforest", "The Forest"),
    ("sonsoftheforest", "Sons of the Forest"),
    ("noita", "Noita"),
    ("7daystodie", "7 Days to Die"),
    ("projectzomboid", "Project Zomboid"),
    ("grounded", "Grounded"),
    ("raft", "Raft"),
    // Co-op / Multiplayer
    ("helldivers2", "Helldivers 2"),
    ("deeprockgalactic", "Deep Rock Galactic"),
    ("phasmophobia", "Phasmophobia"),
    ("lethalcompany", "Lethal Company"),
    ("contentwarning", "Content Warning"),
    ("seaofthieves", "Sea of Thieves"),
    ("readyornot", "Ready or Not"),
    ("gtfo", "GTFO"),
    ("backforrblood", "Back 4 Blood"),
    ("l4d2", "Left 4 Dead 2"),
    // Strategy / Management
    ("civilization", "Civilization"),
    ("civ6", "Civilization VI"),
    ("civ7", "Civilization VII"),
    ("totalwar", "Total War"),
    ("stellaris", "Stellaris"),
    ("citiesii", "Cities: Skylines II"),
    ("citiesskylines", "Cities: Skylines"),
    ("ageofempires", "Age of Empires"),
    ("aoe", "Age of Empires"),
    // Sports
    ("fifa", "EA FC / FIFA"),
    ("fc24", "EA FC 24"),
    ("fc25", "EA FC 25"),
    ("nba2k", "NBA 2K"),
    ("rocketleague", "Rocket League"),
    // MOBA / MMO
    ("leagueoflegends", "League of Legends"),
    ("league", "League of Legends"),
    ("lolclient", "League of Legends"),
    ("wow", "World of Warcraft"),
    ("ffxiv", "Final Fantasy XIV"),
    ("ffxiv_dx11", "Final Fantasy XIV"),
    ("genshinimpact", "Genshin Impact"),
    ("yuanshen", "Genshin Impact"),
    ("starrail", "Honkai: Star Rail"),
    ("zenlesszonezero", "Zenless Zone Zero"),
    ("lostark", "Lost Ark"),
    ("warframe", "Warframe"),
    ("warframe.x64", "Warframe"),
    ("pathofexile", "Path of Exile"),
    ("pathofexile_x64", "Path of Exile"),
    ("diablo", "Diablo"),
    ("newworld", "New World"),
    // Indie / Other
    ("celeste", "Celeste"),
    ("hollowknight", "Hollow Knight"),
    ("cuphead", "Cuphead"),
    ("hades", "Hades"),
    ("hadesii", "Hades II"),
    ("deadcells", "Dead Cells"),
    ("stardewvalley", "Stardew Valley"),
    ("amongus", "Among Us"),
    ("fallguys", "Fall Guys"),
    ("roblox", "Roblox"),
    ("robloxplayerbeta", "Roblox"),
    ("genshin", "Genshin Impact"),
    ("wuthering", "Wuthering Waves"),
    ("enshrouded", "Enshrouded"),
    ("oncehuman", "Once Human"),
    ("marvelrivals", "Marvel Rivals"),
    ("wukong", "Black Myth: Wukong"),
    ("b1-win64-shipping", "Black Myth: Wukong"),
    ("remnant", "Remnant"),
    ("liesthep", "Lies of P"),
];

// Processes to never auto-detect as a game
const IGNORE_PROCESSES: &[&str] = &[
    "svchost", "explorer", "dwm", "csrss", "lsass", "services", "system",
    "taskhostw", "runtimebroker", "searchhost", "startmenuexperiencehost",
    "shellexperiencehost", "textinputhost", "sihost", "ctfmon", "fontdrvhost",
    "dllhost", "conhost", "wininit", "winlogon", "smss", "msiexec",
    "chrome", "firefox", "msedge", "opera", "brave", "vivaldi", "arc",
    "code", "cursor", "devenv", "idea64", "webstorm64", "rider64",
    "discord", "slack", "teams", "zoom", "spotify", "steam", "steamwebhelper",
    "epicgameslauncher", "eadesktop", "battlenet", "ubisoftconnect",
    "nvidia", "nvcontainer", "nvdisplay", "nvcpl", "geforceexperience",
    "amd", "radeon", "razer", "corsair", "icue", "logitechg",
    "obs64", "obs32", "streamlabs", "windowsterminal", "powershell",
    "cmd", "wt", "node", "python", "pythonw", "java",
    "onedrive", "dropbox", "googledrive", "icloud",
    "metrik", "tauri", "webview2",
    "mspaint", "notepad", "wordpad", "calc", "winrar", "7zfm",
    "vlc", "wmplayer", "mpc-hc64", "potplayer",
    "antimalware", "msmpeng", "securityhealthservice",
    "widgets", "lockapp", "applicationframehost", "gamebar",
    "gamebarftserver", "gamebarpresencewriter", "gamebarpresencewriter",
    "wsl", "vmware", "virtualbox", "hyper-v",
    "afterburner", "rtss", "hwinfo64", "hwmonitor", "cpuz",
    "mstsc", "rdcman", "anydesk", "teamviewer",
    "snippingtool", "screensketch", "sharex",
    "rufus", "etcher", "winget", "choco",
];

const AUTO_DETECT_MIN_MEMORY_MB: f64 = 500.0;
const AUTO_DETECT_MIN_CPU: f32 = 3.0;

pub struct GameProvider {
    sys: Mutex<System>,
}

impl GameProvider {
    pub fn new() -> Self {
        Self {
            sys: Mutex::new(System::new()),
        }
    }
}

fn prettify_exe_name(stem: &str) -> String {
    let cleaned = stem
        .replace("win64-shipping", "")
        .replace("win32-shipping", "")
        .replace("-win64", "")
        .replace("-win32", "")
        .replace("_x64", "")
        .replace("_x86", "")
        .replace("-x64", "")
        .replace(".x64", "")
        .replace('-', " ")
        .replace('_', " ");
    cleaned
        .split_whitespace()
        .filter(|w| !w.is_empty())
        .map(|w| {
            let mut c = w.chars();
            match c.next() {
                None => String::new(),
                Some(f) => f.to_uppercase().to_string() + c.as_str(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn emit_game(
    map: &mut HashMap<String, MetricValue>,
    name: &str,
    process: &sysinfo::Process,
) {
    map.insert("game.name".into(), MetricValue::Text(name.to_string()));

    let mem_bytes = process.memory();
    map.insert(
        "game.memory_mb".into(),
        MetricValue::Float(mem_bytes as f64 / (1024.0 * 1024.0)),
    );

    let cpu = process.cpu_usage();
    map.insert("game.cpu_usage".into(), MetricValue::Float(cpu as f64));

    let pid_u32 = process.pid().as_u32();
    if let Some(fps) = fps_tracer::get_fps(pid_u32) {
        map.insert("game.fps".into(), MetricValue::Float(fps));
    }
}

impl MetricProvider for GameProvider {
    fn name(&self) -> &'static str {
        "game"
    }

    fn poll(&self) -> HashMap<String, MetricValue> {
        let mut map = HashMap::new();
        let mut sys = self.sys.lock().unwrap();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        // Pass 1: check known games list
        for (_pid, process) in sys.processes() {
            let exe_name = process.name().to_string_lossy().to_lowercase();
            let stem = exe_name.trim_end_matches(".exe");

            if let Some((_, display)) = KNOWN_GAMES.iter().find(|(pat, _)| stem.contains(pat)) {
                emit_game(&mut map, display, process);
                return map;
            }
        }

        // Pass 2: auto-detect by resource usage (high memory + CPU = likely a game)
        let mut best: Option<(&sysinfo::Process, f64)> = None;

        for (_pid, process) in sys.processes() {
            let exe_name = process.name().to_string_lossy().to_lowercase();
            let stem = exe_name.trim_end_matches(".exe");

            if IGNORE_PROCESSES.iter().any(|&ig| stem.contains(ig)) {
                continue;
            }

            let mem_mb = process.memory() as f64 / (1024.0 * 1024.0);
            let cpu = process.cpu_usage();

            if mem_mb >= AUTO_DETECT_MIN_MEMORY_MB && cpu >= AUTO_DETECT_MIN_CPU {
                let score = mem_mb + (cpu as f64 * 10.0);
                if best.as_ref().map_or(true, |(_, s)| score > *s) {
                    best = Some((process, score));
                }
            }
        }

        if let Some((process, _)) = best {
            let exe_name = process.name().to_string_lossy().to_lowercase();
            let stem = exe_name.trim_end_matches(".exe");
            let display = prettify_exe_name(stem);
            emit_game(&mut map, &display, process);
        }

        map
    }
}
