-- Stage 3 seed data: vehicle_specs (~40 popular cars) + mod_catalog (~25 presets)
-- Idempotent — uses ON CONFLICT DO NOTHING.

-- ── vehicle_specs seed ─────────────────────────────────────────────────
INSERT INTO "vehicle_specs"
  ("id", "year", "make", "model", "trim", "engine", "displacement", "aspiration",
   "fuel_type", "transmission", "drivetrain", "stock_hp", "stock_torque",
   "curb_weight", "zero_to_sixty", "quarter_mile", "top_speed",
   "source_provider", "source_confidence")
VALUES
  -- BMW
  ('seed_bmw_m4_2015',        2015, 'BMW', 'M4', 'Coupe',     'Twin-turbo I6',  '3.0L', 'TwinTurbo', 'Gasoline', 'DCT',    'RWD', 425, 406, 3530, 4.1, 12.1, 155, 'seed', 'verified'),
  ('seed_bmw_m4_2021',        2021, 'BMW', 'M4', 'Competition','Twin-turbo I6', '3.0L', 'TwinTurbo', 'Gasoline', 'Auto',   'RWD', 503, 479, 3880, 3.8, 11.6, 180, 'seed', 'verified'),
  ('seed_bmw_m3_2015',        2015, 'BMW', 'M3', 'Sedan',     'Twin-turbo I6',  '3.0L', 'TwinTurbo', 'Gasoline', 'DCT',    'RWD', 425, 406, 3540, 4.1, 12.1, 155, 'seed', 'verified'),
  ('seed_bmw_m5_2018',        2018, 'BMW', 'M5', 'Sedan',     'Twin-turbo V8',  '4.4L', 'TwinTurbo', 'Gasoline', 'Auto',   'AWD', 600, 553, 4370, 3.2, 11.1, 189, 'seed', 'verified'),
  ('seed_bmw_335i_2011',      2011, 'BMW', '335i', 'Coupe',   'Twin-turbo I6',  '3.0L', 'TwinTurbo', 'Gasoline', 'DCT',    'RWD', 300, 300, 3625, 5.0, 13.5, 150, 'seed', 'verified'),

  -- Toyota / Subaru / Honda
  ('seed_toyota_supra_2020',  2020, 'Toyota', 'Supra', '3.0',  'Twin-turbo I6',  '3.0L', 'TwinTurbo', 'Gasoline', 'Auto',   'RWD', 335, 365, 3397, 4.1, 12.3, 155, 'seed', 'verified'),
  ('seed_toyota_supra_1995',  1995, 'Toyota', 'Supra', 'Turbo','2JZ-GTE I6',     '3.0L', 'TwinTurbo', 'Gasoline', 'Manual', 'RWD', 320, 315, 3415, 4.6, 13.1, 155, 'seed', 'verified'),
  ('seed_toyota_gr86_2022',   2022, 'Toyota', 'GR86', 'Premium','Boxer 4',       '2.4L', 'NA',        'Gasoline', 'Manual', 'RWD', 228, 184, 2811, 6.1, 14.6, 140, 'seed', 'verified'),
  ('seed_subaru_wrx_2022',    2022, 'Subaru', 'WRX', 'Premium','Boxer 4',        '2.4L', 'Turbo',     'Gasoline', 'Manual', 'AWD', 271, 258, 3340, 5.4, 14.0, 145, 'seed', 'verified'),
  ('seed_subaru_sti_2018',    2018, 'Subaru', 'WRX STI', 'Base','Boxer 4',       '2.5L', 'Turbo',     'Gasoline', 'Manual', 'AWD', 305, 290, 3391, 5.1, 13.6, 158, 'seed', 'verified'),
  ('seed_subaru_brz_2022',    2022, 'Subaru', 'BRZ', 'Limited','Boxer 4',        '2.4L', 'NA',        'Gasoline', 'Manual', 'RWD', 228, 184, 2815, 6.1, 14.6, 140, 'seed', 'verified'),
  ('seed_honda_civic_si_2022',2022, 'Honda',  'Civic Si', 'Base','I4',            '1.5L', 'Turbo',     'Gasoline', 'Manual', 'FWD', 200, 192, 2952, 6.6, 14.9, 137, 'seed', 'verified'),
  ('seed_honda_typer_2023',   2023, 'Honda',  'Civic Type R', 'Base','I4',        '2.0L', 'Turbo',     'Gasoline', 'Manual', 'FWD', 315, 310, 3188, 5.0, 13.7, 169, 'seed', 'verified'),
  ('seed_acura_nsx_2017',     2017, 'Acura',  'NSX', 'Base',  'Twin-turbo V6 Hybrid','3.5L','TwinTurbo','Hybrid','DCT',   'AWD', 573, 476, 3878, 2.9, 11.0, 191, 'seed', 'verified'),

  -- Nissan
  ('seed_nissan_gtr_2017',    2017, 'Nissan', 'GT-R', 'Premium','Twin-turbo V6', '3.8L', 'TwinTurbo', 'Gasoline', 'DCT',    'AWD', 565, 467, 3933, 2.9, 11.1, 196, 'seed', 'verified'),
  ('seed_nissan_350z_2006',   2006, 'Nissan', '350Z', 'Touring','VQ35DE V6',     '3.5L', 'NA',        'Gasoline', 'Manual', 'RWD', 287, 274, 3380, 5.4, 14.0, 155, 'seed', 'verified'),
  ('seed_nissan_370z_2015',   2015, 'Nissan', '370Z', 'Sport',  'VQ37VHR V6',    '3.7L', 'NA',        'Gasoline', 'Manual', 'RWD', 332, 270, 3333, 5.1, 13.4, 155, 'seed', 'verified'),
  ('seed_nissan_240sx_1995',  1995, 'Nissan', '240SX', 'SE',    'KA24DE I4',     '2.4L', 'NA',        'Gasoline', 'Manual', 'RWD', 155, 160, 2745, 7.7, 16.0, 130, 'seed', 'verified'),

  -- Ford / Chevy / Dodge
  ('seed_ford_mustang_gt_2018',  2018, 'Ford', 'Mustang GT', 'Premium','V8',      '5.0L', 'NA',        'Gasoline', 'Manual', 'RWD', 460, 420, 3705, 4.1, 12.3, 155, 'seed', 'verified'),
  ('seed_ford_mustang_gt500_2020',2020,'Ford','Mustang Shelby GT500','Base','Supercharged V8','5.2L','Supercharged','Gasoline','DCT','RWD',760,625,4225,3.4,10.7,180,'seed','verified'),
  ('seed_ford_focus_rs_2017', 2017, 'Ford', 'Focus RS', 'Base', 'I4',            '2.3L', 'Turbo',     'Gasoline', 'Manual', 'AWD', 350, 350, 3434, 4.5, 13.0, 165, 'seed', 'verified'),
  ('seed_chevy_camaro_ss_2017',2017,'Chevrolet','Camaro SS','1SS','V8',          '6.2L', 'NA',        'Gasoline', 'Manual', 'RWD', 455, 455, 3685, 4.0, 12.3, 165, 'seed', 'verified'),
  ('seed_chevy_camaro_zl1_2017',2017,'Chevrolet','Camaro ZL1','Base','Supercharged V8','6.2L','Supercharged','Gasoline','Manual','RWD',650,650,3920,3.5,11.4,200,'seed','verified'),
  ('seed_chevy_corvette_z06_2017',2017,'Chevrolet','Corvette Z06','1LZ','Supercharged V8','6.2L','Supercharged','Gasoline','Manual','RWD',650,650,3524,3.0,10.95,205,'seed','verified'),
  ('seed_chevy_corvette_c8_2020',2020,'Chevrolet','Corvette Stingray','1LT','V8','6.2L','NA','Gasoline','DCT','RWD',495,470,3535,2.9,11.2,194,'seed','verified'),
  ('seed_dodge_challenger_hellcat_2018',2018,'Dodge','Challenger SRT Hellcat','Base','Supercharged V8','6.2L','Supercharged','Gasoline','Auto','RWD',717,656,4448,3.6,11.2,199,'seed','verified'),
  ('seed_dodge_challenger_demon_2018',2018,'Dodge','Challenger SRT Demon','Base','Supercharged V8','6.2L','Supercharged','Gasoline','Auto','RWD',808,717,4255,2.3,9.65,168,'seed','verified'),
  ('seed_dodge_charger_hellcat_2018',2018,'Dodge','Charger SRT Hellcat','Base','Supercharged V8','6.2L','Supercharged','Gasoline','Auto','RWD',707,650,4575,3.6,11.0,196,'seed','verified'),

  -- Audi / VW / Porsche / Mercedes
  ('seed_audi_rs3_2022',      2022, 'Audi', 'RS3', 'Base',     'I5',             '2.5L', 'Turbo',     'Gasoline', 'DCT',    'AWD', 401, 369, 3649, 3.6, 11.8, 180, 'seed', 'verified'),
  ('seed_audi_r8_v10_2017',   2017, 'Audi', 'R8', 'V10',       'V10',            '5.2L', 'NA',        'Gasoline', 'DCT',    'AWD', 540, 398, 3594, 3.5, 11.5, 201, 'seed', 'verified'),
  ('seed_vw_golf_r_2022',     2022, 'Volkswagen','Golf R','Base','I4',           '2.0L', 'Turbo',     'Gasoline', 'DCT',    'AWD', 315, 310, 3373, 4.4, 13.1, 168, 'seed', 'verified'),
  ('seed_vw_gti_2022',        2022, 'Volkswagen','GTI','SE',   'I4',             '2.0L', 'Turbo',     'Gasoline', 'Manual', 'FWD', 241, 273, 3168, 5.6, 14.1, 155, 'seed', 'verified'),
  ('seed_porsche_911_gt3_2022',2022,'Porsche','911 GT3','Base','Boxer 6',        '4.0L', 'NA',        'Gasoline', 'DCT',    'RWD', 502, 346, 3164, 3.2, 11.0, 197, 'seed', 'verified'),
  ('seed_porsche_911_turbo_s_2021',2021,'Porsche','911 Turbo S','Base','Twin-turbo Boxer 6','3.7L','TwinTurbo','Gasoline','DCT','AWD',640,590,3635,2.6,10.5,205,'seed','verified'),
  ('seed_porsche_cayman_gt4_2022',2022,'Porsche','718 Cayman GT4','Base','Boxer 6','4.0L','NA','Gasoline','Manual','RWD',414,309,3208,3.9,12.4,188,'seed','verified'),
  ('seed_mercedes_c63_2022',  2022, 'Mercedes-Benz','AMG C63 S','Sedan','Twin-turbo V8','4.0L','TwinTurbo','Gasoline','Auto','RWD',503,516,4045,3.8,11.9,180,'seed','verified'),

  -- Tesla / EV
  ('seed_tesla_model3_perf_2022',2022,'Tesla','Model 3','Performance','Dual Motor EV',NULL,'EV','Electric','Auto','AWD',450,471,4034,3.1,11.6,162,'seed','verified'),
  ('seed_tesla_models_plaid_2022',2022,'Tesla','Model S','Plaid','Tri Motor EV',NULL,'EV','Electric','Auto','AWD',1020,1050,4766,1.99,9.23,200,'seed','verified'),
  ('seed_tesla_modely_perf_2022',2022,'Tesla','Model Y','Performance','Dual Motor EV',NULL,'EV','Electric','Auto','AWD',456,497,4416,3.5,12.0,155,'seed','verified'),

  -- Mazda / Mitsubishi / Hyundai (a couple more popular tuners)
  ('seed_mazda_miata_nd_2019',2019,'Mazda','MX-5 Miata','Club','I4','2.0L','NA','Gasoline','Manual','RWD',181,151,2339,5.7,14.5,135,'seed','verified'),
  ('seed_mitsu_evo_x_2015',   2015, 'Mitsubishi','Lancer Evolution X','MR','I4','2.0L','Turbo','Gasoline','DCT','AWD',291,300,3585,4.7,13.2,155,'seed','verified'),
  ('seed_hyundai_n_2022',     2022, 'Hyundai','Elantra N','Base','I4','2.0L','Turbo','Gasoline','DCT','FWD',276,289,3296,5.0,13.5,155,'seed','verified')
ON CONFLICT (id) DO NOTHING;


-- ── mod_catalog seed ───────────────────────────────────────────────────
INSERT INTO "mod_catalog"
  ("id", "category", "name", "description",
   "default_hp_gain", "default_torque_gain", "default_weight_change",
   "traction_modifier", "launch_modifier", "shift_modifier",
   "handling_modifier", "reliability_modifier", "display_order")
VALUES
  -- Tuning
  ('mod_tune_stage1',    'Tune', 'Stage 1 ECU Tune',     'Pump-gas tune, factory hardware. Common gains on turbo cars.', 50,  70,   0, 0, 0, 0,  0, -0.5, 10),
  ('mod_tune_stage2',    'Tune', 'Stage 2 ECU Tune',     'Tune paired with intake/exhaust/downpipes. Bigger gains.',     90, 110,   0, 0, 0, 0,  0, -1.0, 11),
  ('mod_tune_stage3',    'Tune', 'Stage 3 ECU Tune',     'High-mod tune, often with bigger turbo or fueling.',         140, 150,   0, 0, 0, 0,  0, -1.5, 12),
  ('mod_tune_e85',       'Fuel', 'E85 Flex-Fuel Tune',   'High-octane ethanol blend. Big gains on forced-induction cars.',80,  90,   0, 0, 0, 0,  0, -0.5, 20),

  -- Bolt-ons
  ('mod_intake_cai',     'Intake',     'Cold Air Intake',         'Aftermarket intake pulling cooler air.',           8,   5,  -3, 0, 0, 0,  0,  0, 30),
  ('mod_exhaust_cb',     'Exhaust',    'Catback Exhaust',         'Replaces stock exhaust from cat back.',           10,   8, -15, 0, 0, 0,  0,  0, 31),
  ('mod_dp_catless',     'Downpipes',  'Catless Downpipes',       'Removes catalytic converters. Big turbo gains.',  25,  30, -10, 0, 0, 0,  0, -1.0, 32),
  ('mod_dp_high_flow',   'Downpipes',  'High-Flow Cat Downpipes', 'Replaces stock cats with high-flow units.',       18,  22, -8,  0, 0, 0,  0,  0, 33),
  ('mod_headers',        'Headers',    'Long-Tube Headers',       'Replaces stock manifold. Common V8 mod.',         20,  18, -10, 0, 0, 0,  0,  0, 34),
  ('mod_intercooler',    'Intercooler','Front-Mount Intercooler', 'Larger IC for sustained turbo cooling.',          15,  15,   5, 0, 0, 0,  0,  0.5, 35),
  ('mod_turbo_swap',     'Turbo',      'Turbo Upgrade',           'Bigger turbo, larger compressor.',               150, 130,  10, 0, 0, 0,  0, -2.0, 40),
  ('mod_supercharger',   'Turbo',      'Supercharger Kit',        'Supercharger conversion (where applicable).',    150, 120,  35, 0, 0, 0,  0, -1.5, 41),
  ('mod_meth_inject',    'Fuel',       'Methanol Injection',      'Cools intake charge, adds octane.',               25,  30,   8, 0, 0, 0,  0,  0, 42),

  -- Drivetrain / shifting
  ('mod_short_shifter',  'Transmission','Short Shifter',          'Shorter throws, faster manual shifts.',            0,   0,   0, 0, 0, 1.0, 0,  0, 50),
  ('mod_clutch_upgrade', 'Transmission','Stage 2 Clutch',         'Holds more torque for high-HP builds.',            0,   0,   2, 0, 0, 0.5, 0,  0, 51),
  ('mod_dct_tune',       'Transmission','DCT Calibration',        'Faster, harder shifts on DCT cars.',               0,   0,   0, 0, 0.5, 1.5, 0, -0.5, 52),

  -- Tires / launch
  ('mod_tires_drag',     'Tires',      'Drag Radials',            'Sticky compound for drag launches.',                0,   0,   8, 1.5, 1.5, 0,  -0.5, 0, 60),
  ('mod_tires_perf',     'Tires',      'Performance Summer Tires','High-grip street tires.',                           0,   0,   2, 0.7, 0.5, 0,   1.0, 0, 61),
  ('mod_tires_track',    'Tires',      'Track / R-Compound Tires','Track-focused tires. Best grip overall.',           0,   0,   3, 1.2, 1.0, 0,   1.5, 0, 62),

  -- Suspension / brakes
  ('mod_coilovers',      'Suspension','Coilovers',                'Adjustable height + damping.',                       0,   0,  -8, 0,    0,   0, 1.5, 0, 70),
  ('mod_swaybars',       'Suspension','Anti-Sway Bars',           'Reduces body roll, sharper turn-in.',                0,   0,   3, 0,    0,   0, 0.8, 0, 71),
  ('mod_brakes_bbk',     'Brakes',    'Big Brake Kit',            'Larger rotors and calipers.',                        0,   0,  20, 0,    0,   0, 0.5, 0, 72),

  -- Weight reduction
  ('mod_seat_delete',    'WeightReduction','Rear Seat Delete',    'Removes rear seats and trim.',                       0,   0, -45, 0,   0.3,   0, 0,  0, 80),
  ('mod_lightweight_wheels','WeightReduction','Lightweight Wheels','Forged or cast wheels saving rotational mass.',     0,   0, -30, 0,   0.3, 0.3, 0.5, 0, 81),
  ('mod_carbon_hood',    'WeightReduction','Carbon Fiber Hood',   'Saves weight, lowers center of gravity slightly.',   0,   0, -20, 0,    0,   0, 0.2, 0, 82),

  -- Aero
  ('mod_splitter',       'Aero',     'Front Splitter',            'Adds front downforce at speed.',                     0,   0,   8, 0,    0,   0, 0.3, 0, 90),
  ('mod_wing',           'Aero',     'Rear Wing',                 'Track-style wing.',                                  0,   0,  10, 0,    0,   0, 0.3, 0, 91)
ON CONFLICT (id) DO NOTHING;
